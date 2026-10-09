"use client";

import { useEffect, useState } from "react";
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
import { api, type ModelsResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

const SCENARIOS = [
  { value: "A", label: "Scenario A" },
  { value: "B", label: "Scenario B" },
];

const EXPECTED_SECONDS = 60;

const GAME_INFO_KEYS = "game, genre, unit, previous_patch, current_patch, patch_date, levels, patch_notes";

function FileField({
  label,
  hint,
  accept,
  file,
  onFile,
  disabled,
}: {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  onFile: (f: File | null) => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        className="block w-full cursor-pointer rounded-lg border border-input bg-background text-xs file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-input file:bg-muted file:px-3 file:py-2 file:font-mono file:text-xs"
      />
      <span className="font-mono text-[11px] text-muted-foreground">{file ? `${file.name} · ${Math.ceil(file.size / 1024)} KB` : hint}</span>
    </label>
  );
}

export function NewRunButton({ onCreated }: { onCreated: (id: string) => void }) {
  const [models, setModels] = useState<ModelsResponse | null>(null);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState<"A" | "B">("A");
  const [telemetry, setTelemetry] = useState(true);
  const [model, setModel] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"scenario" | "upload">("scenario");
  const [messagesFile, setMessagesFile] = useState<File | null>(null);
  const [telemetryFile, setTelemetryFile] = useState<File | null>(null);
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    api
      .models()
      .then((m) => {
        setModels(m);
        setModel(m.default);
      })
      .catch((e: Error) => setModelsError(e.message));
  }, []);

  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(t);
  }, [running]);

  async function start() {
    setError(null);
    setElapsed(0);
    setRunning(true);
    try {
      let res: { id: string };
      if (mode === "upload") {
        if (!messagesFile || !gameFile) throw new Error("Add messages.csv and game_info.json to start an upload run.");
        const [messages_csv, game_info_json, telemetry_csv] = await Promise.all([
          messagesFile.text(),
          gameFile.text(),
          telemetryFile ? telemetryFile.text() : Promise.resolve(undefined),
        ]);
        try {
          JSON.parse(game_info_json);
        } catch {
          throw new Error("game_info.json isn't valid JSON.");
        }
        res = await api.createRun({
          upload: { messages_csv, game_info_json, ...(telemetry_csv ? { telemetry_csv } : {}) },
          telemetry: !!telemetry_csv && telemetry,
          model,
          ...(name.trim() ? { name: name.trim() } : {}),
        });
      } else {
        res = await api.createRun({ scenario, telemetry, model });
      }
      setOpen(false);
      onCreated(res.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const disabledReason = modelsError
    ? "Can't reach the API, so new runs are unavailable."
    : models && !models.live
      ? "No API key configured on the server. Showing saved runs only."
      : null;

  const trigger = (
    <Button size="sm" disabled={!!disabledReason || !models} onClick={() => setOpen(true)}>
      <PlusIcon /> New run
    </Button>
  );

  const modelItems = models?.models.map((m) => ({ value: m.id, label: m.id })) ?? [];

  return (
    <>
      {disabledReason ? (
        <Tooltip>
          <TooltipTrigger render={<span tabIndex={0} />}>{trigger}</TooltipTrigger>
          <TooltipContent side="bottom">{disabledReason}</TooltipContent>
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

          <Tabs value={mode} onValueChange={(v) => setMode(v as "scenario" | "upload")}>
            <TabsList className="w-full">
              <TabsTrigger value="scenario" disabled={running}>
                Scenario
              </TabsTrigger>
              <TabsTrigger value="upload" disabled={running}>
                Upload
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4 py-2">
            {mode === "upload" ? (
              <div className="grid gap-3">
                <FileField
                  label="messages.csv"
                  hint="Required · columns id,timestamp,channel,author,text"
                  accept=".csv,text/csv"
                  file={messagesFile}
                  onFile={setMessagesFile}
                  disabled={running}
                />
                <FileField
                  label="telemetry.csv (optional)"
                  hint="Leave empty for a community-only run"
                  accept=".csv,text/csv"
                  file={telemetryFile}
                  onFile={setTelemetryFile}
                  disabled={running}
                />
                <FileField
                  label="game_info.json"
                  hint={`Required keys: ${GAME_INFO_KEYS}`}
                  accept=".json,application/json"
                  file={gameFile}
                  onFile={setGameFile}
                  disabled={running}
                />
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Run name (optional)</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={running}
                    placeholder="e.g. Patch 1.4 week one"
                    className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </label>
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
              </div>
            ) : (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Scenario</span>
              <Select items={SCENARIOS} value={scenario} onValueChange={(v) => v && setScenario(v as "A" | "B")}>
                <SelectTrigger className="w-full" disabled={running}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCENARIOS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            )}
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Model</span>
              <Select items={modelItems} value={model} onValueChange={(v) => v && setModel(v as string)}>
                <SelectTrigger className="w-full" disabled={running}>
                  <SelectValue />
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
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                <span className="block font-medium">Use telemetry</span>
                <span className="text-muted-foreground">Off = community reports only, nothing can be dismissed.</span>
              </span>
              <Switch
                checked={mode === "upload" ? telemetry && !!telemetryFile : telemetry}
                onCheckedChange={setTelemetry}
                disabled={running || (mode === "upload" && !telemetryFile)}
              />
            </label>
          </div>

          {running && (
            <div className="space-y-2">
              <Progress value={Math.min(95, (elapsed / EXPECTED_SECONDS) * 100)} />
              <p className="text-xs text-muted-foreground tabular-nums">
                Reading messages and checking telemetry… {elapsed}s (usually about a minute)
              </p>
            </div>
          )}
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" disabled={running} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={start} disabled={running || !model || (mode === "upload" && (!messagesFile || !gameFile))}>
              {running && <Loader2Icon className={cn("animate-spin")} />}
              {running ? "Running…" : "Start run"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
