"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api, ApiError, type ModelsResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

const SCENARIOS = [
  { value: "A", label: "Scenario A" },
  { value: "B", label: "Scenario B" },
];

const EXPECTED_SECONDS = 60;

const GAME_INFO_KEYS = "game, genre, unit, previous_patch, current_patch, patch_date, levels, patch_notes";

const fileSchema = z.custom<File | null>((v) => v === null || (typeof File !== "undefined" && v instanceof File));

function buildSchema(modelIds: string[]) {
  return z
    .object({
      mode: z.enum(["scenario", "upload"]),
      scenario: z.enum(["A", "B"], { error: "Pick a scenario." }).nullable(),
      model: z.string().refine((m) => modelIds.includes(m), "Pick a model from the list."),
      telemetry: z.boolean(),
      messagesFile: fileSchema,
      telemetryFile: fileSchema,
      gameFile: fileSchema,
      name: z.string().trim().max(80, "Keep the name under 80 characters."),
    })
    .superRefine(async (v, ctx) => {
      if (v.mode === "scenario") {
        if (!v.scenario) ctx.addIssue({ code: "custom", path: ["scenario"], message: "Pick a scenario." });
        return;
      }
      if (!v.messagesFile) {
        ctx.addIssue({ code: "custom", path: ["messagesFile"], message: "messages.csv is required." });
      } else if (!v.messagesFile.name.toLowerCase().endsWith(".csv")) {
        ctx.addIssue({ code: "custom", path: ["messagesFile"], message: "messages.csv must be a .csv file." });
      }
      if (v.telemetryFile && !v.telemetryFile.name.toLowerCase().endsWith(".csv")) {
        ctx.addIssue({ code: "custom", path: ["telemetryFile"], message: "telemetry.csv must be a .csv file." });
      }
      if (!v.gameFile) {
        ctx.addIssue({ code: "custom", path: ["gameFile"], message: "game_info.json is required." });
        return;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(await v.gameFile.text());
      } catch {
        ctx.addIssue({ code: "custom", path: ["gameFile"], message: "game_info.json isn't valid JSON." });
        return;
      }
      const missing = ["levels", "current_patch", "previous_patch"].filter(
        (k) => !parsed || typeof parsed !== "object" || !(k in (parsed as object)),
      );
      if (missing.length) {
        ctx.addIssue({ code: "custom", path: ["gameFile"], message: `game_info.json is missing: ${missing.join(", ")}.` });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;
type FileKey = "messagesFile" | "telemetryFile" | "gameFile";

function FileField({
  control,
  name,
  label,
  hint,
  accept,
  disabled,
}: {
  control: Control<FormValues>;
  name: FileKey;
  label: string;
  hint: string;
  accept: string;
  disabled?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="gap-1">
          <FieldLabel htmlFor={`run-${name}`}>{label}</FieldLabel>
          <input
            id={`run-${name}`}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            type="file"
            accept={accept}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            onChange={(e) => field.onChange(e.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-lg border border-input bg-background text-xs file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-input file:bg-muted file:px-3 file:py-2 file:font-mono file:text-xs aria-invalid:border-destructive"
          />
          {fieldState.invalid ? (
            <FieldError errors={[fieldState.error]} className="text-xs" />
          ) : (
            <FieldDescription className="font-mono text-[11px]">
              {field.value ? `${field.value.name} · ${Math.ceil(field.value.size / 1024)} KB` : hint}
            </FieldDescription>
          )}
        </Field>
      )}
    />
  );
}

export function NewRunButton({ onCreated }: { onCreated: (id: string) => void }) {
  const router = useRouter();
  const [models, setModels] = useState<ModelsResponse | null>(null);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const modelIds = useMemo(() => models?.models.map((m) => m.id) ?? [], [models]);
  const schema = useMemo(() => buildSchema(modelIds), [modelIds]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      mode: "scenario",
      scenario: "A",
      model: "",
      telemetry: true,
      messagesFile: null,
      telemetryFile: null,
      gameFile: null,
      name: "",
    },
  });
  const { control } = form;
  const running = form.formState.isSubmitting;
  const mode = useWatch({ control, name: "mode" });
  const telemetryFile = useWatch({ control, name: "telemetryFile" });

  useEffect(() => {
    api
      .models()
      .then((m) => {
        setModels(m);
        form.setValue("model", m.default);
      })
      .catch((e: Error) => setModelsError(e.message));
  }, [form]);

  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    setElapsed(0);
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(t);
  }, [running]);

  async function onSubmit(v: FormValues) {
    setError(null);
    try {
      let res: { id: string };
      if (v.mode === "upload") {
        const [messages_csv, game_info_json, telemetry_csv] = await Promise.all([
          v.messagesFile!.text(),
          v.gameFile!.text(),
          v.telemetryFile ? v.telemetryFile.text() : Promise.resolve(undefined),
        ]);
        const name = v.name.trim();
        res = await api.createRun({
          upload: { messages_csv, game_info_json, ...(telemetry_csv ? { telemetry_csv } : {}) },
          telemetry: !!telemetry_csv && v.telemetry,
          model: v.model,
          ...(name ? { name } : {}),
        });
      } else {
        res = await api.createRun({ scenario: v.scenario ?? "A", telemetry: v.telemetry, model: v.model });
      }
      setOpen(false);
      onCreated(res.id);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        // Session expired mid-dialog: refresh so the auth gate shows the login card.
        setOpen(false);
        router.refresh();
        return;
      }
      setError((e as Error).message);
    }
  }

  const disabledReason = modelsError
    ? "Can't reach the API, so new runs are unavailable."
    : models && !models.live
      ? "No API key configured on the server. Showing saved runs only."
      : null;

  const trigger = (
    <Button
      size="sm"
      disabled={!!disabledReason || !models}
      onClick={() => setOpen(true)}
    >
      <PlusIcon /> New run
    </Button>
  );
  const tooltip = disabledReason;

  const modelItems = models?.models.map((m) => ({ value: m.id, label: m.id })) ?? [];

  return (
    <>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger render={<span tabIndex={0} />}>{trigger}</TooltipTrigger>
          <TooltipContent side="bottom">{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <Dialog open={open} onOpenChange={(o) => !running && setOpen(o)}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New analysis run</DialogTitle>
            <DialogDescription>
              Classify every player message, group them into issues, and check each one against telemetry.
            </DialogDescription>
          </DialogHeader>

          <form id="new-run-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <Controller
              control={control}
              name="mode"
              render={({ field }) => (
                <Tabs
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.clearErrors();
                    setError(null);
                  }}
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="scenario" disabled={running}>
                      Scenario
                    </TabsTrigger>
                    <TabsTrigger value="upload" disabled={running}>
                      Upload
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />

            <FieldGroup className="gap-4 py-2">
              {mode === "upload" ? (
                <>
                  <FileField
                    control={control}
                    name="messagesFile"
                    label="messages.csv"
                    hint="Required · columns id,timestamp,channel,author,text"
                    accept=".csv,text/csv"
                    disabled={running}
                  />
                  <FileField
                    control={control}
                    name="telemetryFile"
                    label="telemetry.csv (optional)"
                    hint="Leave empty for a community-only run"
                    accept=".csv,text/csv"
                    disabled={running}
                  />
                  <FileField
                    control={control}
                    name="gameFile"
                    label="game_info.json"
                    hint={`Required keys: ${GAME_INFO_KEYS}`}
                    accept=".json,application/json"
                    disabled={running}
                  />
                  <Controller
                    control={control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="gap-1">
                        <FieldLabel htmlFor="run-name">Run name (optional)</FieldLabel>
                        <Input
                          {...field}
                          id="run-name"
                          disabled={running}
                          aria-invalid={fieldState.invalid}
                          placeholder="e.g. Patch 1.4 week one"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-xs" />}
                      </Field>
                    )}
                  />
                  <details className="rounded-lg border border-dashed border-border px-3 py-2 text-xs">
                    <summary className="cursor-pointer font-mono text-muted-foreground">Expected formats</summary>
                    <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre text-muted-foreground">{`messages.csv
id,timestamp,channel,author,text
A001,2026-10-02T11:02,discord,ash_92,"fell through the floor on lvl 4"
(channel: discord | steam_review | in_game)

telemetry.csv
patch,level,players_started,players_completed,completion_rate,
deaths_per_player,restarts_per_player,error_reports,median_minutes
1.3,1,11800,11328,0.96,0.6,1.0,2,6

game_info.json
{ "game": "Ember Trail", "genre": "platformer", "unit": "level",
  "previous_patch": "1.3", "current_patch": "1.4",
  "patch_date": "2026-10-01T10:00",
  "levels": { "1": "Ashfield", "2": "Old Mill" },
  "patch_notes": "Reworked bridges on level 4…" }`}</pre>
                  </details>
                </>
              ) : (
                <Controller
                  control={control}
                  name="scenario"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="gap-1.5">
                      <FieldLabel htmlFor="run-scenario">Scenario</FieldLabel>
                      <Select items={SCENARIOS} value={field.value} onValueChange={(v) => field.onChange(v ?? null)}>
                        <SelectTrigger id="run-scenario" className="w-full" disabled={running} aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Pick a scenario" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCENARIOS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-xs" />}
                    </Field>
                  )}
                />
              )}
              <Controller
                control={control}
                name="model"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1.5">
                    <FieldLabel htmlFor="run-model">Model</FieldLabel>
                    <Select items={modelItems} value={field.value} onValueChange={(v) => v && field.onChange(v as string)}>
                      <SelectTrigger id="run-model" className="w-full" disabled={running} aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Pick a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models?.models.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="flex w-full justify-between gap-4">
                              <span>{m.id}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                ${m.in}/${m.out} per MTok
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-xs" />}
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="telemetry"
                render={({ field }) => (
                  <Field orientation="horizontal" className="justify-between gap-4">
                    <FieldContent>
                      <FieldLabel htmlFor="run-telemetry">Use telemetry</FieldLabel>
                      <FieldDescription>Off = community reports only, nothing can be dismissed.</FieldDescription>
                    </FieldContent>
                    <Switch
                      id="run-telemetry"
                      checked={mode === "upload" ? field.value && !!telemetryFile : field.value}
                      onCheckedChange={field.onChange}
                      disabled={running || (mode === "upload" && !telemetryFile)}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </form>

          {running && (
            <div className="space-y-2">
              <Progress value={Math.min(95, (elapsed / EXPECTED_SECONDS) * 100)} />
              <p className="text-xs text-muted-foreground tabular-nums">
                Reading messages and checking telemetry… {elapsed}s (usually about a minute)
              </p>
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" disabled={running} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="new-run-form" disabled={running || !models}>
              {running && <Loader2Icon className={cn("animate-spin")} />}
              {running ? "Running…" : "Start run"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
