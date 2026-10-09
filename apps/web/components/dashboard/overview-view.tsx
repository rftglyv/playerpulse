"use client";

import { ArrowRightIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { RunResult } from "@/lib/api";
import { fmt, LANGUAGE_NAMES, langLabel } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, CategoryBadge, whereLabel } from "./issues-view";
import { CHANNEL_LABEL, ChannelIcon } from "./voices-view";

const MONO_TICK = { fontSize: 11, fontFamily: "var(--font-plex-mono), ui-monospace, monospace" };

function Panel({
  title,
  note,
  children,
  className,
}: {
  title: string;
  note?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section data-card className={cn("rounded-[10px] border border-border bg-card p-5", className)}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-lg font-medium tracking-[-0.01em]">{title}</h3>
        {note && <span className="font-mono text-[11px] text-muted-foreground">{note}</span>}
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "loss" | "proof" | "watch" }) {
  return (
    <div className="min-w-0 px-5 py-4">
      <div
        className={cn(
          "font-serif text-[clamp(1.7rem,3vw,2.3rem)] leading-none font-semibold tracking-[-0.02em] tabular-nums lining-nums",
          tone === "loss" && "text-loss",
          tone === "proof" && "text-proof",
          tone === "watch" && "text-watch",
        )}
      >
        {value}
      </div>
      <div className="mt-2 font-mono text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function BarList({ rows }: { rows: { key: string; label: React.ReactNode; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[8.5rem_minmax(0,1fr)_5rem] items-center gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-1.5 truncate">{r.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-watch" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-right font-mono text-xs tabular-nums">
            {r.value} <span className="text-muted-foreground">· {Math.round((r.value / total) * 100)}%</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const funnelConfig = {
  prev: { label: "Previous patch", color: "var(--chart-1)" },
  cur: { label: "Current patch", color: "var(--watch)" },
} satisfies ChartConfig;

const timeConfig = {
  bug: { label: CATEGORY_LABEL.bug, color: "var(--loss)" },
  balance: { label: CATEGORY_LABEL.balance, color: "var(--watch)" },
  skill_issue: { label: CATEGORY_LABEL.skill_issue, color: "var(--proof)" },
} satisfies ChartConfig;

export function levelName(result: RunResult, level: number) {
  return result.levels?.[String(level)] ?? `${result.unit} ${level}`;
}

export function OverviewView({ result, onOpenIssues }: { result: RunResult; onOpenIssues: () => void }) {
  const reported = result.issues.filter((i) => i.status === "reported");
  const dismissed = result.issues.filter((i) => i.status === "dismissed");
  const lost = reported.reduce((a, i) => a + (i.players_lost_estimate || 0), 0);
  const signal = result.messages.filter((m) => m.category !== "noise");

  // Level funnel
  const table = result.telemetry_table;
  const funnel = table
    ? [...new Set(table.map((r) => r.level))]
        .sort((a, b) => a - b)
        .map((lvl) => {
          const p = table.find((r) => r.level === lvl && r.patch === result.previous_patch);
          const c = table.find((r) => r.level === lvl && r.patch === result.current_patch);
          return {
            level: String(lvl),
            name: levelName(result, lvl),
            prev: p ? Math.round(p.completion_rate * 100) : null,
            cur: c ? Math.round(c.completion_rate * 100) : null,
          };
        })
    : [];

  // Reports over time (per day, stacked by category)
  const byDay = new Map<string, { day: string; bug: number; balance: number; skill_issue: number }>();
  for (const m of signal) {
    const day = (m.timestamp ?? "").slice(0, 10);
    if (!day) continue;
    const row = byDay.get(day) ?? { day, bug: 0, balance: 0, skill_issue: 0 };
    if (m.category in row) row[m.category as "bug" | "balance" | "skill_issue"]++;
    byDay.set(day, row);
  }
  const timeline = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));

  const tally = (key: "channel" | "language") => {
    const map = new Map<string, number>();
    for (const m of result.messages) map.set(m[key] || "unknown", (map.get(m[key] || "unknown") ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  const top = [...reported].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)).slice(0, 3);

  return (
    <div className="space-y-5">
      <div
        data-card
        className="grid grid-cols-2 divide-border overflow-hidden rounded-[10px] border border-border bg-card sm:grid-cols-3 lg:grid-cols-5 lg:divide-x"
      >
        <Kpi label="messages analysed" value={fmt.int(result.messages.length)} />
        <Kpi label="issues reported" value={fmt.int(reported.length)} tone="loss" />
        <Kpi label="dismissed with proof" value={fmt.int(dismissed.length)} tone="proof" />
        <Kpi label="players lost (est.)" value={fmt.int(lost)} tone="loss" />
        <Kpi label={`run cost · ${fmt.dec(result.meta?.seconds)}s`} value={fmt.usd(result.meta?.cost_usd)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Level funnel" note={`completion rate · ${result.previous_patch} vs ${result.current_patch}`}>
          {funnel.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-10 text-center font-mono text-xs text-muted-foreground">
              Community-only run: no telemetry, so there is no funnel to draw.
            </p>
          ) : (
            <ChartContainer config={funnelConfig} className="aspect-auto h-64 w-full">
              <BarChart data={funnel} barGap={1} margin={{ left: -16, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="level" tickLine={false} axisLine={false} tick={MONO_TICK} />
                <YAxis tickLine={false} axisLine={false} tick={MONO_TICK} domain={[0, 100]} unit="%" />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(l, p) => p?.[0]?.payload?.name ?? l}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="prev" fill="var(--color-prev)" radius={2} isAnimationActive={false} />
                <Bar dataKey="cur" fill="var(--color-cur)" radius={2} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          )}
        </Panel>

        <Panel title="Reports over time" note={`${signal.length} non-noise messages per day`}>
          {timeline.length === 0 ? (
            <p className="py-10 text-center font-mono text-xs text-muted-foreground">No timestamps in this run.</p>
          ) : (
            <ChartContainer config={timeConfig} className="aspect-auto h-64 w-full">
              <BarChart data={timeline} margin={{ left: -24, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={MONO_TICK}
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis tickLine={false} axisLine={false} tick={MONO_TICK} allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="bug" stackId="a" fill="var(--color-bug)" isAnimationActive={false} />
                <Bar dataKey="balance" stackId="a" fill="var(--color-balance)" isAnimationActive={false} />
                <Bar dataKey="skill_issue" stackId="a" fill="var(--color-skill_issue)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Where players talk">
          <BarList
            rows={tally("channel").map(([k, v]) => ({
              key: k,
              value: v,
              label: (
                <>
                  <ChannelIcon channel={k} className="size-3.5 text-muted-foreground" />
                  {CHANNEL_LABEL[k] ?? k}
                </>
              ),
            }))}
          />
        </Panel>
        <Panel title="Languages">
          <BarList
            rows={tally("language").map(([k, v]) => ({
              key: k,
              value: v,
              label: (
                <>
                  <span className="font-mono text-[11px] text-muted-foreground">{langLabel(k)}</span>
                  {LANGUAGE_NAMES[k.toLowerCase()] ?? (k === "mixed" ? "Mixed" : k)}
                </>
              ),
            }))}
          />
        </Panel>
        <Panel title="Top 3 to fix">
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">No verified issues in this run.</p>
          ) : (
            <ol className="space-y-3">
              {top.map((i, idx) => (
                <li key={idx}>
                  <button
                    onClick={onOpenIssues}
                    className="group grid w-full grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-2 text-left"
                  >
                    <span className="font-mono text-xs text-muted-foreground">#{i.priority ?? idx + 1}</span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-medium group-hover:underline">
                        {i.ticket?.title ?? i.title}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                        <CategoryBadge category={i.category} /> {whereLabel(i, result.unit)}
                      </span>
                    </span>
                    <span className="font-mono text-sm text-loss tabular-nums">{fmt.int(i.players_lost_estimate)}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <button
            onClick={onOpenIssues}
            className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-watch hover:underline"
          >
            All issues <ArrowRightIcon className="size-3" />
          </button>
        </Panel>
      </div>
    </div>
  );
}
