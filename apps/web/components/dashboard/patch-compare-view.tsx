"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Issue, RunResult, TelemetryRow } from "@/lib/api";
import { fmt } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CompletionLollipop } from "./charts/completion-lollipop";
import { EmptyState } from "./states";

const VERDICT_ORDER: Issue["status"][] = ["reported", "watch", "dismissed"];

function Verdict({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-[3px] border-[1.5px] border-current px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.1em] uppercase",
        status === "reported" && "text-loss",
        status === "dismissed" && "text-proof",
        status === "watch" && "text-watch",
      )}
    >
      {status}
    </span>
  );
}

function Ratio({
  prev,
  cur,
  digits = 1,
}: {
  prev?: number;
  cur?: number;
  digits?: number;
}) {
  if (prev == null || cur == null)
    return <span className="text-muted-foreground">–</span>;
  const worse = cur > prev * 1.15;
  return (
    <span className="font-mono text-[13px] tabular-nums">
      <span className="text-muted-foreground">{prev.toFixed(digits)}</span>
      <span className="px-1 text-muted-foreground">→</span>
      <span className={cn(worse && "text-loss")}>{cur.toFixed(digits)}</span>
    </span>
  );
}

export function PatchCompareView({ result }: { result: RunResult }) {
  const table = result.telemetry_table;
  const levelKeys = Object.keys(result.levels ?? {})
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  const levels = [
    ...new Set([...levelKeys, ...(table?.map((r) => r.level) ?? [])]),
  ].sort((a, b) => a - b);

  if (levels.length === 0)
    return (
      <EmptyState
        title="No levels in this run"
        body="The game info for this run doesn't list any levels."
      />
    );

  const row = (lvl: number, patch: string): TelemetryRow | undefined =>
    table?.find((r) => r.level === lvl && r.patch === patch);

  return (
    <div className="space-y-3">
      {!table && (
        <p className="rounded-lg border border-dashed border-border px-3 py-3 font-mono text-xs text-muted-foreground">
          Community-only run: no telemetry, so only report counts and verdicts
          are shown.
        </p>
      )}
      <div
        data-card
        className="overflow-hidden rounded-[10px] border border-border bg-card"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48 pl-5">
                {result.unit[0]?.toUpperCase() + result.unit.slice(1)}
              </TableHead>
              <TableHead>
                Completion{" "}
                <span className="font-mono text-[11px] font-normal">
                  {result.previous_patch} → {result.current_patch}
                </span>
              </TableHead>
              <TableHead className="text-right">Δ pts</TableHead>
              <TableHead>Deaths / player</TableHead>
              <TableHead>Restarts / player</TableHead>
              <TableHead>Error reports / player</TableHead>
              <TableHead className="text-right">Reports</TableHead>
              <TableHead className="pr-5">Verdict</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.map((lvl) => {
              const p = row(lvl, result.previous_patch);
              const c = row(lvl, result.current_patch);
              const delta =
                p && c
                  ? Math.round((c.completion_rate - p.completion_rate) * 100)
                  : null;
              const issues = result.issues.filter((i) => i.level === lvl);
              const reports = result.messages.filter(
                (m) => m.level === lvl && m.category !== "noise",
              ).length;
              const verdict = VERDICT_ORDER.find((s) =>
                issues.some((i) => i.status === s),
              );
              const errRatio = (r?: TelemetryRow) =>
                r && r.players_started
                  ? (r.error_reports / r.players_started) * 1000
                  : undefined;
              return (
                <TableRow key={lvl}>
                  <TableCell className="pl-5">
                    <span className="mr-2 font-mono text-xs text-muted-foreground">
                      {lvl}
                    </span>
                    <span className="font-medium">
                      {result.levels?.[String(lvl)] ?? `${result.unit} ${lvl}`}
                    </span>
                  </TableCell>
                  <TableCell>
                    {p && c ? (
                      <div className="flex items-center gap-3">
                        <CompletionLollipop
                          prev={p.completion_rate}
                          cur={c.completion_rate}
                        />
                        <span className="font-mono text-[13px] tabular-nums">
                          <span className="text-muted-foreground">
                            {fmt.pct(p.completion_rate)}
                          </span>
                          <span className="px-1 text-muted-foreground">→</span>
                          <span
                            className={cn(
                              delta != null && delta <= -5 && "text-loss",
                            )}
                          >
                            {fmt.pct(c.completion_rate)}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono tabular-nums",
                      delta != null && delta <= -5 && "font-semibold text-loss",
                      delta != null && delta >= 5 && "text-proof",
                    )}
                  >
                    {delta == null ? "–" : delta > 0 ? `+${delta}` : delta}
                  </TableCell>
                  <TableCell>
                    <Ratio
                      prev={p?.deaths_per_player}
                      cur={c?.deaths_per_player}
                    />
                  </TableCell>
                  <TableCell>
                    <Ratio
                      prev={p?.restarts_per_player}
                      cur={c?.restarts_per_player}
                    />
                  </TableCell>
                  <TableCell title="Error reports per 1,000 players started">
                    <Ratio prev={errRatio(p)} cur={errRatio(c)} />
                    {p && c && (
                      <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                        ‰
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {reports || "–"}
                  </TableCell>
                  <TableCell className="pr-5">
                    {verdict ? (
                      <Verdict status={verdict} />
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        Δ in red = completion dropped by 5 points or more. Reports = non-noise
        player messages about the {result.unit}.
      </p>
    </div>
  );
}
