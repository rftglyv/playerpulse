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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api, type ModelsResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

const SCENARIOS = [
  { value: "A", label: "Scenario A" },
  { value: "B", label: "Scenario B" },
];

const EXPECTED_SECONDS = 60;

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
      const res = await api.createRun({ scenario, telemetry, model });
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New analysis run</DialogTitle>
            <DialogDescription>
              Classify every player message, group them into issues, and check each one against telemetry.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
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
              <Switch checked={telemetry} onCheckedChange={setTelemetry} disabled={running} />
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
            <Button onClick={start} disabled={running || !model}>
              {running && <Loader2Icon className={cn("animate-spin")} />}
              {running ? "Running…" : "Start run"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
