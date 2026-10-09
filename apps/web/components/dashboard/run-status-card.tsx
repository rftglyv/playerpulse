"use client";

import type { RunDetail, RunRow } from "@/lib/api";

const fmt = (n: number) => n.toLocaleString("en-US");

/** Compact sidebar card: what run you're looking at, its state, and the numbers that matter. */
export function RunStatusCard({ run, runs }: { run: RunDetail | null; runs: RunRow[] | null }) {
  const running = runs?.find((r) => r.status === "running");
  if (!run && !running) return null;

  const state = running && running.id !== run?.id ? "running" : (run?.status ?? "running");
  const result = run?.result ?? null;
  const reported = result?.issues.filter((i) => i.status === "reported") ?? [];
  const playersLost = reported.reduce((s, i) => s + (i.players_lost_estimate ?? 0), 0);
  const tone =
    state === "failed"
      ? { dot: "bg-destructive", label: "Failed" }
      : state === "running"
        ? { dot: "bg-primary animate-pulse", label: "Running" }
        : { dot: "bg-[var(--proof)]", label: "Done" };

  return (
    <div className="mx-2 rounded-lg border border-sidebar-border bg-background p-3 text-xs group-data-[collapsible=icon]:hidden">
      <div className="flex items-center gap-2">
        <span className={`size-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
        <span className="font-medium">{tone.label}</span>
        <span className="ml-auto truncate text-muted-foreground">{run?.telemetry ? "with telemetry" : "community-only"}</span>
      </div>
      {state === "running" && running && running.id !== run?.id ? (
        <p className="mt-2 text-muted-foreground">A new run is in progress. It appears in the run list when it finishes (~30 s).</p>
      ) : (
        run && (
          <>
            <p className="mt-2 truncate font-medium" title={run.name}>
              {run.name}
            </p>
            <p className="truncate font-mono text-[11px] text-muted-foreground" title={run.model}>
              {run.model}
            </p>
            {result && (
              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-sidebar-border pt-3">
                <div>
                  <dt className="text-muted-foreground">Messages</dt>
                  <dd className="font-mono tabular-nums">{fmt(result.messages.length)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Issues</dt>
                  <dd className="font-mono tabular-nums">{reported.length}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Lost</dt>
                  <dd className="font-mono tabular-nums text-[var(--loss)]">{fmt(playersLost)}</dd>
                </div>
              </dl>
            )}
            <p className="mt-2 font-mono text-[11px] text-muted-foreground tabular-nums">
              ${run.costUsd.toFixed(2)} · {run.seconds}s
            </p>
          </>
        )
      )}
    </div>
  );
}
