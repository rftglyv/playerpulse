"use client";

import { EyeIcon, GavelIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Issue, RunResult } from "@/lib/api";
import { fmt } from "@/lib/api";
import { CategoryBadge, LanguageChips, ViewEmpty, whereLabel } from "./issues-view";
import { ChartLegendInline, TelemetryChart } from "./telemetry-chart";
import { Stamp } from "./case-file";

function headline(issue: Issue, unit: string) {
  const n = issue.distinct_players;
  const where =
    issue.level != null
      ? `${issue.level_name ?? `${unit} ${issue.level}`}${issue.level_name ? ` (${unit} ${issue.level})` : ""}`
      : `an unknown ${unit}`;
  if (issue.category === "skill_issue" || issue.title.toLowerCase().includes("too hard")) {
    return `${n} ${n === 1 ? "player says" : "players say"} ${where} is impossible`;
  }
  return issue.title;
}

function VerdictCard({ issue, result, tone }: { issue: Issue; result: RunResult; tone: "proof" | "watch" }) {
  return (
    <Card
      data-card
      className="relative grid gap-6 rounded-[10px] p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
    >
      <Stamp tone={tone}>{tone === "proof" ? "DISMISSED" : "WATCH"}</Stamp>
      <CardHeader className="flex flex-col gap-3 px-0">
        <CardDescription className="pr-32 text-xs lg:pr-0">{whereLabel(issue, result.unit)}</CardDescription>
        <CardTitle
          role="heading"
          aria-level={3}
          className="pr-24 text-xl leading-tight font-semibold tracking-tight text-balance lg:pr-0"
        >
          {headline(issue, result.unit)}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={issue.category} />
        </div>
        <p className="text-xs text-muted-foreground">
          {issue.message_ids.length} reports from {issue.distinct_players} players
          {issue.players_lost_estimate > 0 && <> · est. {fmt.int(issue.players_lost_estimate)} players lost</>}
        </p>
        {issue.telemetry_evidence && (
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{tone === "proof" ? "Proof: " : "Why we're watching: "}</span>
            {issue.telemetry_evidence}
          </p>
        )}
        <LanguageChips languages={issue.languages} />
      </CardHeader>
      <CardContent className="space-y-3 px-0 lg:pt-10">
        <ChartLegendInline tone={tone} />
        <TelemetryChart telemetry={issue.telemetry} tone={tone} />
      </CardContent>
    </Card>
  );
}

export function DismissedView({ result }: { result: RunResult }) {
  const dismissed = result.issues.filter((i) => i.status === "dismissed");
  const watch = result.issues.filter((i) => i.status === "watch");
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        {dismissed.length === 0 ? (
          <ViewEmpty
            icon={GavelIcon}
            title="Nothing dismissed"
            body={
              result.telemetry
                ? "Every complaint in this run was backed by telemetry or kept on the watch list."
                : "This run had no telemetry, so no complaint could be settled with numbers."
            }
          />
        ) : (
          dismissed.map((i, idx) => <VerdictCard key={idx} issue={i} result={result} tone="proof" />)
        )}
      </section>
      <section className="space-y-4">
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Watch list</h2>
            <p className="text-sm text-muted-foreground">Signals that aren&apos;t strong enough to act on yet.</p>
          </div>
          <Separator />
        </div>
        {watch.length === 0 ? (
          <ViewEmpty icon={EyeIcon} title="Watch list is empty" />
        ) : (
          watch.map((i, idx) => <VerdictCard key={idx} issue={i} result={result} tone="watch" />)
        )}
      </section>
    </div>
  );
}
