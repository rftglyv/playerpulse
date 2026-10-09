"use client";

import Link from "next/link";
import { Iconizer } from "@/components/iconizer";
import type { RunResult } from "@/lib/api";
import { fmt, LANGUAGE_NAMES, langLabel } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { CATEGORY_LABEL, CategoryBadge, whereLabel } from "./issues-view";
import { CHANNEL_LABEL, ChannelIcon } from "./voices-view";
import { DonutChart } from "./charts/donut-chart";
import { LevelFunnelChart } from "./charts/level-funnel-chart";
import { MiniBars, PALETTE, SegmentBar, Sparkline } from "./charts/mini";
import { ReportsTimelineChart } from "./charts/reports-timeline-chart";

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
    <Card data-card className={cn("gap-4 py-5 [--card-spacing:--spacing(5)]", className)}>
      <CardHeader className="flex items-baseline justify-between gap-3">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        {note && <CardDescription className="text-xs">{note}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}

function Kpi({
  label,
  value,
  tone,
  chart,
  caption,
}: {
  label: string;
  value: string;
  tone?: "loss" | "proof" | "watch";
  chart?: React.ReactNode;
  caption?: React.ReactNode;
}) {
  return (
    <CardHeader className="relative min-w-0 content-between gap-3 px-5 py-4">
      <CardDescription className="min-w-0 text-xs">{label}</CardDescription>
      {chart && <CardAction className="shrink-0">{chart}</CardAction>}
      <div className="col-span-full">
        <CardTitle
          className={cn(
            "font-serif text-[clamp(1.7rem,3vw,2.3rem)] leading-none font-semibold tracking-[-0.02em] tabular-nums lining-nums",
            tone === "loss" && "text-loss",
            tone === "proof" && "text-proof",
            tone === "watch" && "text-watch",
          )}
        >
          {value}
        </CardTitle>
        {caption && (
          <Badge variant="secondary" className="mt-2 max-w-full justify-start truncate text-[11px] font-normal text-muted-foreground">
            {caption}
          </Badge>
        )}
      </div>
    </CardHeader>
  );
}

export function levelName(result: RunResult, level: number) {
  return result.levels?.[String(level)] ?? `${result.unit} ${level}`;
}

export function OverviewView({
  result,
  issuesHref,
}: {
  result: RunResult;
  issuesHref: string;
}) {
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
          const p = table.find(
            (r) => r.level === lvl && r.patch === result.previous_patch,
          );
          const c = table.find(
            (r) => r.level === lvl && r.patch === result.current_patch,
          );
          return {
            level: String(lvl),
            name: levelName(result, lvl),
            prev: p ? Math.round(p.completion_rate * 100) : null,
            cur: c ? Math.round(c.completion_rate * 100) : null,
          };
        })
    : [];

  // Reports over time (per day, stacked by category)
  const byDay = new Map<
    string,
    { day: string; bug: number; balance: number; skill_issue: number }
  >();
  for (const m of signal) {
    const day = (m.timestamp ?? "").slice(0, 10);
    if (!day) continue;
    const row = byDay.get(day) ?? { day, bug: 0, balance: 0, skill_issue: 0 };
    if (m.category in row)
      row[m.category as "bug" | "balance" | "skill_issue"]++;
    byDay.set(day, row);
  }
  const timeline = [...byDay.values()].sort((a, b) =>
    a.day.localeCompare(b.day),
  );

  const tally = (key: "channel" | "language") => {
    const map = new Map<string, number>();
    for (const m of result.messages)
      map.set(m[key] || "unknown", (map.get(m[key] || "unknown") ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  // KPI ribbon mini charts
  const perDay = new Map<string, number>();
  for (const m of result.messages) {
    const day = (m.timestamp ?? "").slice(0, 10);
    if (day) perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  const msgSeries = [...perDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => v);
  const lostByLevel = new Map<number, number>();
  for (const i of reported) {
    if (i.level == null) continue;
    lostByLevel.set(
      i.level,
      (lostByLevel.get(i.level) ?? 0) + (i.players_lost_estimate || 0),
    );
  }
  const lostSeries = [...lostByLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
  const worstLevel = [...lostByLevel.entries()].sort((a, b) => b[1] - a[1])[0];
  const countCat = (cat: string) =>
    result.messages.filter((m) => m.category === cat).length;
  const categorySegments = [
    {
      key: "bug",
      label: CATEGORY_LABEL.bug ?? "Bug",
      value: countCat("bug"),
      color: PALETTE.red,
    },
    {
      key: "balance",
      label: CATEGORY_LABEL.balance ?? "Balance",
      value: countCat("balance"),
      color: PALETTE.blue,
    },
    {
      key: "skill_issue",
      label: CATEGORY_LABEL.skill_issue ?? "Skill issue",
      value: countCat("skill_issue"),
      color: PALETTE.green,
    },
    {
      key: "noise",
      label: "Noise",
      value: countCat("noise"),
      color: PALETTE.neutral,
    },
  ];
  const verdicts = reported.length + dismissed.length;
  const drops = funnel.filter(
    (r) => r.prev != null && r.cur != null && r.prev - r.cur >= 5,
  ).length;

  const top = [...reported]
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
    .slice(0, 3);

  return (
    <div className="space-y-5">
      <Card
        data-card
        className="grid grid-cols-2 gap-0 divide-border py-0 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x"
      >
        <Kpi
          label="messages analysed"
          value={fmt.int(result.messages.length)}
          chart={<Sparkline values={msgSeries} color={PALETTE.blue} />}
          caption={
            msgSeries.length > 1
              ? `${msgSeries.length} days · peak ${Math.max(...msgSeries)}/day`
              : `${signal.length} non-noise`
          }
        />
        <Kpi
          label="issues reported"
          value={fmt.int(reported.length)}
          tone="loss"
          chart={
            <SegmentBar
              compact
              className="w-[72px] pt-2"
              segments={categorySegments.slice(0, 3)}
            />
          }
          caption={
            drops > 0
              ? `${drops} level${drops === 1 ? "" : "s"} dropped ≥5 pts`
              : `${signal.length} signals`
          }
        />
        <Kpi
          label="dismissed with proof"
          value={fmt.int(dismissed.length)}
          tone="proof"
          chart={
            <SegmentBar
              compact
              className="w-[72px] pt-2"
              segments={[
                {
                  key: "r",
                  label: "Reported",
                  value: reported.length,
                  color: PALETTE.red,
                },
                {
                  key: "d",
                  label: "Dismissed",
                  value: dismissed.length,
                  color: PALETTE.green,
                },
              ]}
            />
          }
          caption={
            verdicts
              ? `${Math.round((dismissed.length / verdicts) * 100)}% of verdicts`
              : "no verdicts"
          }
        />
        <Kpi
          label="players lost (est.)"
          value={fmt.int(lost)}
          tone="loss"
          chart={<MiniBars values={lostSeries} color={PALETTE.red} />}
          caption={
            worstLevel
              ? `worst: ${levelName(result, worstLevel[0])}`
              : "per level"
          }
        />
        <Kpi
          label={`run cost · ${fmt.dec(result.meta?.seconds)}s`}
          value={fmt.usd(result.meta?.cost_usd)}
          caption={
            result.meta?.cost_usd != null && result.messages.length
              ? `${fmt.usd(result.meta.cost_usd / result.messages.length)} / message`
              : undefined
          }
        />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Level funnel"
          note={`completion rate · ${result.previous_patch} vs ${result.current_patch}`}
        >
          {funnel.length === 0 ? (
            <Empty className="border border-dashed py-10">
              <EmptyDescription className="text-xs">
                Community-only run: no telemetry, so there is no funnel to draw.
              </EmptyDescription>
            </Empty>
          ) : (
            <LevelFunnelChart
              data={funnel}
              previousPatch={result.previous_patch}
              currentPatch={result.current_patch}
            />
          )}
        </Panel>

        <Panel
          title="Reports over time"
          note={`${signal.length} non-noise messages per day`}
        >
          {timeline.length === 0 ? (
            <Empty className="py-10">
              <EmptyDescription className="text-xs">No timestamps in this run.</EmptyDescription>
            </Empty>
          ) : (
            <ReportsTimelineChart
              data={timeline}
              labels={{
                bug: CATEGORY_LABEL.bug ?? "Bug",
                balance: CATEGORY_LABEL.balance ?? "Balance",
                skill_issue: CATEGORY_LABEL.skill_issue ?? "Skill issue",
              }}
            />
          )}
        </Panel>
      </div>

      <Panel
        title="Message categories"
        note={`${fmt.int(result.messages.length)} messages classified`}
      >
        <SegmentBar segments={categorySegments} />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Where players talk">
          <DonutChart
            totalLabel="messages"
            items={tally("channel").map(([k, v]) => ({
              key: k,
              value: v,
              name: CHANNEL_LABEL[k] ?? k,
              label: (
                <>
                  <ChannelIcon
                    channel={k}
                    size={14}
                    className="text-muted-foreground"
                  />
                  {CHANNEL_LABEL[k] ?? k}
                </>
              ),
            }))}
          />
        </Panel>
        <Panel title="Languages">
          <DonutChart
            totalLabel="messages"
            items={tally("language").map(([k, v]) => ({
              key: k,
              value: v,
              name:
                LANGUAGE_NAMES[k.toLowerCase()] ??
                (k === "mixed" ? "Mixed" : k),
              label: (
                <>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {langLabel(k)}
                  </span>
                  {LANGUAGE_NAMES[k.toLowerCase()] ??
                    (k === "mixed" ? "Mixed" : k)}
                </>
              ),
            }))}
          />
        </Panel>
        <Panel title="Top 3 to fix">
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No verified issues in this run.
            </p>
          ) : (
            <ItemGroup className="gap-1">
              {top.map((i, idx) => (
                <Item
                  key={idx}
                  size="xs"
                  className="group -mx-2.5 flex-nowrap items-start"
                  render={<Link href={issuesHref} />}
                >
                  <ItemMedia className="w-6 justify-start text-xs tabular-nums text-muted-foreground">
                    #{i.priority ?? idx + 1}
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="line-clamp-2 w-auto group-hover:underline">
                      {i.ticket?.title ?? i.title}
                    </ItemTitle>
                    <ItemDescription className="flex items-center gap-1.5 text-xs">
                      <CategoryBadge category={i.category} />{" "}
                      {whereLabel(i, result.unit)}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="font-mono text-sm text-loss tabular-nums">
                    {fmt.int(i.players_lost_estimate)}
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
          <Link
            href={issuesHref}
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-watch hover:underline"
          >
            All issues <Iconizer icon="arrow_forward" size={12} />
          </Link>
        </Panel>
      </div>
    </div>
  );
}
