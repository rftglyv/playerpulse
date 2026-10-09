"use client";

import type { Issue, RunResult } from "@/lib/api";
import { fmt } from "@/lib/api";
import { CategoryBadge, LanguageChips, whereLabel } from "./issues-view";
import { ChartLegendInline, TelemetryChart } from "./telemetry-chart";
import { EmptyState } from "./states";

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
    <article className="grid gap-5 rounded-xl bg-card p-5 ring-1 ring-foreground/8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={
              tone === "proof"
                ? "rounded-md bg-proof/15 px-2 py-0.5 text-xs font-medium text-proof"
                : "rounded-md bg-watch/15 px-2 py-0.5 text-xs font-medium text-watch"
            }
          >
            {tone === "proof" ? "Dismissed" : "Watching"}
          </span>
          <CategoryBadge category={issue.category} />
          <span className="text-sm text-muted-foreground">{whereLabel(issue, result.unit)}</span>
        </div>
        <h3 className="text-lg font-semibold leading-snug text-balance">{headline(issue, result.unit)}</h3>
        <p className="text-sm text-muted-foreground">
          {issue.message_ids.length} reports from {issue.distinct_players} players
          {issue.players_lost_estimate > 0 && <> · est. {fmt.int(issue.players_lost_estimate)} players lost</>}
        </p>
        {issue.telemetry_evidence && (
          <p className="text-sm leading-relaxed">
            <span className="font-medium">{tone === "proof" ? "Proof: " : "Why we're watching: "}</span>
            {issue.telemetry_evidence}
          </p>
        )}
        <LanguageChips languages={issue.languages} />
      </div>
      <div className="space-y-2">
        <ChartLegendInline tone={tone} />
        <TelemetryChart telemetry={issue.telemetry} tone={tone} />
      </div>
    </article>
  );
}

export function DismissedView({ result }: { result: RunResult }) {
  const dismissed = result.issues.filter((i) => i.status === "dismissed");
  const watch = result.issues.filter((i) => i.status === "watch");
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Dismissed with proof</h2>
          <p className="text-sm text-muted-foreground">
            Loud complaints where the numbers didn&apos;t move. Technical bugs are never dismissed this way.
          </p>
        </div>
        {dismissed.length === 0 ? (
          <EmptyState
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
        <div>
          <h2 className="text-base font-semibold">Watch list</h2>
          <p className="text-sm text-muted-foreground">Signals that aren&apos;t strong enough to act on yet.</p>
        </div>
        {watch.length === 0 ? (
          <EmptyState title="Watch list is empty" />
        ) : (
          watch.map((i, idx) => <VerdictCard key={idx} issue={i} result={result} tone="watch" />)
        )}
      </section>
    </div>
  );
}
