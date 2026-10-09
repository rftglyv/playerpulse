"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { MONO_TICK, PALETTE } from "./mini";

export type TimelineRow = {
  day: string;
  bug: number;
  balance: number;
  skill_issue: number;
};
type Key = "bug" | "balance" | "skill_issue";
const KEYS: Key[] = ["bug", "balance", "skill_issue"];

/** chart-32 style: per-day stacked bars with thin gaps and toggle-pill legend. */
export function ReportsTimelineChart({
  data,
  labels,
}: {
  data: TimelineRow[];
  labels: Record<Key, string>;
}) {
  const [hidden, setHidden] = React.useState<Set<Key>>(new Set());
  const config = {
    bug: { label: labels.bug, color: PALETTE.red },
    balance: { label: labels.balance, color: PALETTE.blue },
    skill_issue: { label: labels.skill_issue, color: PALETTE.green },
  } satisfies ChartConfig;
  const totals = Object.fromEntries(
    KEYS.map((k) => [k, data.reduce((a, r) => a + r[k], 0)]),
  ) as Record<Key, number>;
  const visible = KEYS.filter((k) => !hidden.has(k));
  const toggle = (k: Key) =>
    setHidden((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else if (visible.length > 1) n.add(k);
      return n;
    });

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {KEYS.map((k) => {
          const off = hidden.has(k);
          return (
            <button
              key={k}
              type="button"
              aria-pressed={!off}
              onClick={() => toggle(k)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                off
                  ? "border-dashed border-border text-muted-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{
                  background: off ? "transparent" : config[k].color,
                  boxShadow: off
                    ? `inset 0 0 0 1px ${config[k].color}`
                    : undefined,
                }}
              />
              {config[k].label}
              <span className="tabular-nums text-muted-foreground">
                {totals[k]}
              </span>
            </button>
          );
        })}
      </div>
      <ChartContainer config={config} className="aspect-auto h-56 w-full">
        <BarChart
          data={data}
          barCategoryGap="18%"
          margin={{ left: -24, right: 4, top: 4 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="2 4" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={MONO_TICK}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={MONO_TICK}
            allowDecimals={false}
          />
          <ChartTooltip
            cursor={{ fill: "rgba(10,10,10,0.04)" }}
            content={<ChartTooltipContent className="tabular-nums" />}
          />
          {KEYS.map((k) => (
            <Bar
              key={k}
              dataKey={k}
              stackId="a"
              hide={hidden.has(k)}
              fill={`var(--color-${k})`}
              stroke="var(--card)"
              strokeWidth={1.5}
              radius={k === visible[visible.length - 1] ? [3, 3, 0, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
