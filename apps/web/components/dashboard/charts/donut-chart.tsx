"use client";

import * as React from "react";
import { Cell, Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PALETTE } from "./mini";

const RAMP = [
  PALETTE.blue,
  PALETTE.ink,
  "#7FA3F2",
  PALETTE.neutral,
  "#1E3A8A",
  "#DCE6FB",
  "#6B6B6B",
];

export type DonutItem = {
  key: string;
  name?: string;
  label: React.ReactNode;
  value: number;
};

/** chart-13 style donut: center total + per-item legend with %. */
export function DonutChart({
  items,
  totalLabel,
}: {
  items: DonutItem[];
  totalLabel: string;
}) {
  const total = items.reduce((a, i) => a + i.value, 0);
  const data = items.map((i, idx) => ({
    key: i.key,
    value: i.value,
    fill: RAMP[idx % RAMP.length],
  }));
  const config = Object.fromEntries(
    items.map((i, idx) => [
      i.key,
      {
        label: i.name ?? (typeof i.label === "string" ? i.label : i.key),
        color: RAMP[idx % RAMP.length],
      },
    ]),
  ) satisfies ChartConfig;

  if (total === 0)
    return (
      <p className="py-8 text-center font-mono text-xs text-muted-foreground">
        No messages.
      </p>
    );

  return (
    <div className="flex flex-col items-center gap-4">
      <ChartContainer
        config={config}
        className="aspect-square h-36 w-36 shrink-0"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                nameKey="key"
                className="font-mono"
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            innerRadius={46}
            outerRadius={66}
            paddingAngle={items.length > 1 ? 2 : 0}
            cornerRadius={3}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={d.fill} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox)) return null;
                const { cx, cy } = viewBox as { cx: number; cy: number };
                return (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={cx}
                      y={cy - 4}
                      className="fill-foreground font-serif text-2xl font-semibold"
                      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                    >
                      {total}
                    </tspan>
                    <tspan
                      x={cx}
                      y={cy + 16}
                      className="fill-muted-foreground font-mono text-[10px]"
                    >
                      {totalLabel}
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="w-full min-w-0 space-y-1.5">
        {items.map((i, idx) => (
          <li
            key={i.key}
            className="grid grid-cols-[0.5rem_minmax(0,1fr)_auto] items-start gap-2 text-sm"
          >
            <span
              className="size-2 rounded-[2px]"
              style={{ background: RAMP[idx % RAMP.length] }}
            />
            <span className="flex min-w-0 flex-wrap items-center gap-1.5 break-words">
              {i.label}
            </span>
            <span className="font-mono text-xs tabular-nums">
              {i.value}{" "}
              <span className="text-muted-foreground">
                · {Math.round((i.value / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
