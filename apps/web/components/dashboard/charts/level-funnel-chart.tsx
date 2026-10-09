"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DotGrid, MONO_TICK, PALETTE } from "./mini";

export type FunnelRow = {
  level: string;
  name: string;
  prev: number | null;
  cur: number | null;
};

const config = {
  prev: { label: "Previous patch", color: PALETTE.neutral },
  cur: { label: "Current patch", color: PALETTE.blue },
} satisfies ChartConfig;

const dropped = (r: FunnelRow) =>
  r.prev != null && r.cur != null && r.prev - r.cur >= 5;

/** chart-29 style: hatched previous patch vs solid current patch on a dotted backdrop. */
export function LevelFunnelChart({
  data,
  previousPatch,
  currentPatch,
}: {
  data: FunnelRow[];
  previousPatch: string;
  currentPatch: string;
}) {
  const drops = data.filter(dropped).length;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <svg className="size-2.5 rounded-[2px]" aria-hidden>
            <rect width="10" height="10" fill="url(#pp-legend-hatch)" />
            <defs>
              <pattern
                id="pp-legend-hatch"
                width="4"
                height="4"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="4" height="4" fill="#EDEDED" />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="4"
                  stroke={PALETTE.neutral}
                  strokeWidth="2"
                />
              </pattern>
            </defs>
          </svg>
          {previousPatch}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-[2px]"
            style={{ background: PALETTE.blue }}
          />{" "}
          {currentPatch}
        </span>
        {drops > 0 && (
          <span className="flex items-center gap-1.5 text-loss">
            <span
              className="size-2.5 rounded-[2px]"
              style={{ background: PALETTE.red }}
            />{" "}
            dropped ≥5 pts · {drops}
          </span>
        )}
      </div>
      <DotGrid className="px-1 pt-2">
        <ChartContainer config={config} className="aspect-auto h-60 w-full">
          <BarChart
            data={data}
            barGap={3}
            barCategoryGap="22%"
            margin={{ left: -16, right: 4, top: 4 }}
          >
            <defs>
              <pattern
                id="pp-hatch-prev"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" fill="#F2F2F2" />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="6"
                  stroke={PALETTE.neutral}
                  strokeWidth="2.5"
                />
              </pattern>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="2 4" />
            <XAxis
              dataKey="level"
              tickLine={false}
              axisLine={false}
              tick={MONO_TICK}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={MONO_TICK}
              domain={[0, 100]}
              unit="%"
            />
            <ChartTooltip
              cursor={{ fill: "rgba(10,10,10,0.04)" }}
              content={
                <ChartTooltipContent
                  className="font-mono"
                  labelFormatter={(l, p) => p?.[0]?.payload?.name ?? l}
                />
              }
            />
            <Bar
              dataKey="prev"
              fill="url(#pp-hatch-prev)"
              stroke={PALETTE.neutral}
              strokeWidth={1}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="cur"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            >
              {data.map((r) => (
                <Cell
                  key={r.level}
                  fill={dropped(r) ? PALETTE.red : PALETTE.blue}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </DotGrid>
    </div>
  );
}
