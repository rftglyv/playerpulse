"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Issue } from "@/lib/api";
import { fmt } from "@/lib/api";
import { cn } from "@/lib/utils";

type Row = NonNullable<Issue["telemetry"]>["prev"];

const METRICS: { key: keyof Row; label: string; format: (n: number) => string; higherIsWorse: boolean }[] = [
  { key: "completion_rate", label: "Completion", format: (n) => fmt.pct(n), higherIsWorse: false },
  { key: "deaths_per_player", label: "Deaths / player", format: (n) => fmt.dec(n), higherIsWorse: true },
  { key: "restarts_per_player", label: "Restarts / player", format: (n) => fmt.dec(n), higherIsWorse: true },
  { key: "error_reports", label: "Error reports", format: (n) => fmt.int(n), higherIsWorse: true },
];

const config = {
  prev: { label: "Previous patch", color: "var(--chart-1)" },
  cur: { label: "Current patch", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function TelemetryChart({
  telemetry,
  tone = "loss",
}: {
  telemetry: Issue["telemetry"];
  tone?: "loss" | "proof" | "watch";
}) {
  if (!telemetry) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
        No telemetry for this level in this run. Verdict is based on player reports only.
      </p>
    );
  }
  const { prev, cur } = telemetry;
  // Each metric has its own scale, so bars are normalised per metric; real values are printed beside them.
  const data = METRICS.map((m) => {
    const p = Number(prev[m.key]) || 0;
    const c = Number(cur[m.key]) || 0;
    const max = Math.max(p, c) || 1;
    return { metric: m.label, prev: (p / max) * 100, cur: (c / max) * 100, prevRaw: m.format(p), curRaw: m.format(c) };
  });
  const curColor = tone === "proof" ? "var(--proof)" : tone === "watch" ? "var(--watch)" : "var(--loss)";

  return (
    <div className="space-y-3">
      <ChartContainer
        config={{ ...config, cur: { ...config.cur, color: curColor } }}
        className="aspect-auto h-36 w-full"
      >
        <BarChart data={data} layout="vertical" barGap={2} barCategoryGap={8} margin={{ left: 0, right: 8 }}>
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis
            type="category"
            dataKey="metric"
            tickLine={false}
            axisLine={false}
            width={108}
            tick={{ fontSize: 11, fontFamily: "var(--font-plex-mono), ui-monospace, monospace" }}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(_value, name, item) => (
                  <div className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">{name === "prev" ? "Previous patch" : "Current patch"}</span>
                    <span className="font-medium tabular-nums">
                      {name === "prev" ? item.payload.prevRaw : item.payload.curRaw}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="prev" fill="var(--color-prev)" radius={3} isAnimationActive={false} />
          <Bar dataKey="cur" fill="var(--color-cur)" radius={3} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
      <dl className="border-t border-border text-sm">
        {METRICS.map((m) => {
          const p = Number(prev[m.key]) || 0;
          const c = Number(cur[m.key]) || 0;
          const worse = m.higherIsWorse ? c > p * 1.15 : c < p * 0.85;
          return (
            <div key={m.key} className="flex items-baseline justify-between gap-3 border-b border-border py-2">
              <dt className="text-muted-foreground">{m.label}</dt>
              <dd className="text-right font-mono text-[13px] tabular-nums">
                <span className="text-muted-foreground">{m.format(p)}</span>
                <span className="px-1 text-muted-foreground">→</span>
                <span className={cn(worse ? "text-loss" : "text-foreground")}>{m.format(c)}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export function ChartLegendInline({ tone = "loss" }: { tone?: "loss" | "proof" | "watch" }) {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-[2px] bg-chart-1" /> {"Previous patch"}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "size-2 rounded-[2px]",
            tone === "proof" ? "bg-proof" : tone === "watch" ? "bg-watch" : "bg-loss",
          )}
        />{" "}
        Current patch
      </span>
    </div>
  );
}
