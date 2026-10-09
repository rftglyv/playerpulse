"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const PALETTE = {
  blue: "#2563EB",
  red: "#B91C1C",
  green: "#15803D",
  neutral: "#BDBDBD",
  ink: "#0A0A0A",
} as const;

export const MONO_TICK = {
  fontSize: 11,
  fontFamily: "var(--font-plex-mono), ui-monospace, monospace",
};

/** Dotted-grid backdrop (radial-gradient dots) used behind the hero charts. */
export function DotGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative rounded-lg", className)}
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(10,10,10,0.13) 1px, transparent 1.2px)",
        backgroundSize: "12px 12px",
      }}
    >
      {children}
    </div>
  );
}

/** Tiny area sparkline in plain SVG. */
export function Sparkline({
  values,
  color = PALETTE.blue,
  className,
}: {
  values: number[];
  color?: string;
  className?: string;
}) {
  const id = React.useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const w = 72;
  const h = 26;
  const max = Math.max(1, ...values);
  const pts = values.map(
    (v, i) =>
      [(i / (values.length - 1)) * w, h - 2 - (v / max) * (h - 4)] as const,
  );
  const line = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-[26px] w-[72px] overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#sg-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill={color} />
    </svg>
  );
}

/** Tiny column chart in plain SVG. */
export function MiniBars({
  values,
  color = PALETTE.red,
  className,
}: {
  values: number[];
  color?: string;
  className?: string;
}) {
  if (values.length === 0) return null;
  const w = 72;
  const h = 26;
  const max = Math.max(1, ...values);
  const gap = 2;
  const bw = Math.max(2, (w - gap * (values.length - 1)) / values.length);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-[26px] w-[72px]", className)}
      aria-hidden
    >
      {values.map((v, i) => {
        const bh = Math.max(1.5, (v / max) * h);
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx={1}
            fill={color}
            opacity={v === max ? 1 : 0.35}
          />
        );
      })}
    </svg>
  );
}

export type Segment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

/** Segmented distribution bar (chart-9 style). `compact` renders just the bar. */
export function SegmentBar({
  segments,
  compact,
  className,
}: {
  segments: Segment[];
  compact?: boolean;
  className?: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const shown = segments.filter((s) => s.value > 0);
  return (
    <div className={className}>
      <div className={cn("flex w-full gap-[3px]", compact ? "h-1.5" : "h-3")}>
        {total === 0 ? (
          <span className="h-full w-full rounded-[3px] bg-muted" />
        ) : (
          shown.map((s) => (
            <span
              key={s.key}
              title={`${s.label}: ${s.value}`}
              className="h-full rounded-[3px] first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(s.value / total) * 100}%`,
                background: s.color,
                minWidth: 4,
              }}
            />
          ))
        )}
      </div>
      {!compact && (
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {segments.map((s) => (
            <li key={s.key} className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ background: s.color }}
                />
                <span>{s.label}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-semibold tracking-tight tabular-nums lining-nums">
                  {s.value}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {total ? Math.round((s.value / total) * 100) : 0}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
