"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
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
    <Card size="sm" className="mx-2 gap-2 text-xs ring-sidebar-border group-data-[collapsible=icon]:hidden">
      <CardHeader className="flex items-center gap-2">
        <Badge variant={state === "failed" ? "destructive" : "outline"} className="gap-1.5">
          <span className={`size-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
          {tone.label}
        </Badge>
        <span className="ml-auto truncate text-muted-foreground">{run?.telemetry ? "with telemetry" : "community-only"}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {state === "running" && running && running.id !== run?.id ? (
          <p className="text-muted-foreground">A new run is in progress. It appears in the run list when it finishes (~30 s).</p>
        ) : (
          run && (
            <>
              <Item size="xs" className="p-0">
                <ItemContent className="min-w-0">
                  <ItemTitle className="block w-full truncate text-xs" title={run.name}>
                    {run.name}
                  </ItemTitle>
                  <ItemDescription className="truncate font-mono text-[11px]" title={run.model}>
                    {run.model}
                  </ItemDescription>
                </ItemContent>
              </Item>
              {result && (
                <>
                  <Separator className="bg-sidebar-border" />
                  <dl className="grid grid-cols-3 gap-2">
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
                </>
              )}
              <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
                ${run.costUsd.toFixed(2)} · {run.seconds}s
              </p>
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}
