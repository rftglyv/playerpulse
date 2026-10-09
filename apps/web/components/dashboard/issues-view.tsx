"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, InboxIcon, LayoutGridIcon, ListIcon, SearchIcon, SearchXIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Issue, RunResult } from "@/lib/api";
import { fmt, langLabel } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ChartLegendInline, TelemetryChart } from "./telemetry-chart";
import { Stamp } from "./case-file";

export const CATEGORY_LABEL: Record<string, string> = {
  bug: "Bug",
  balance: "Balance",
  skill_issue: "Skill issue",
  noise: "Noise",
};

export function CategoryBadge({ category }: { category: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px]",
        category === "bug" && "border-loss/40 text-loss",
        category === "balance" && "border-watch/40 text-watch",
        category === "skill_issue" && "border-proof/40 text-proof",
      )}
    >
      {CATEGORY_LABEL[category] ?? category}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity) return null;
  return (
    <Badge
      className={cn(
        "text-[11px] capitalize",
        severity === "blocker" && "bg-loss text-background",
        severity === "major" && "bg-loss/10 text-loss",
        severity === "minor" && "bg-muted text-foreground",
        severity === "cosmetic" && "bg-muted text-muted-foreground",
      )}
    >
      {severity}
    </Badge>
  );
}

export function LanguageChips({ languages }: { languages: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {languages.map((l) => (
        <Badge
          key={l}
          variant="outline"
          className="rounded-[5px] border-dashed px-1.5 text-[11px] font-normal text-muted-foreground"
        >
          {langLabel(l)}
        </Badge>
      ))}
    </div>
  );
}

/** Empty state for dashboard views (left-aligned, dashed, like the case-file cards). */
export function ViewEmpty({
  title,
  body,
  icon: Icon = InboxIcon,
}: {
  title: string;
  body?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Empty className="items-start rounded-[10px] border border-dashed border-border px-6 py-10 text-left">
      <EmptyHeader className="max-w-prose items-start">
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle className="text-lg font-semibold">{title}</EmptyTitle>
        {body && <EmptyDescription>{body}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  );
}

export function whereLabel(issue: Pick<Issue, "level" | "level_name">, unit = "level") {
  if (issue.level == null) return `Unknown ${unit}`;
  return issue.level_name ? `${issue.level_name} · ${unit} ${issue.level}` : `${unit} ${issue.level}`;
}

function toMarkdown(issue: Issue, result: RunResult) {
  const t = issue.ticket;
  const lines: string[] = [];
  lines.push(`## ${t?.title ?? issue.title}`, "");
  lines.push(
    `**Priority:** #${issue.priority ?? "–"} · **Type:** ${CATEGORY_LABEL[issue.category]} · **Severity:** ${t?.severity ?? "–"}`,
  );
  lines.push(
    `**Where:** ${whereLabel(issue, result.unit)} · **Players lost (est.):** ${fmt.int(issue.players_lost_estimate)} · **Reports:** ${issue.message_ids.length} from ${issue.distinct_players} players (${issue.languages.map(langLabel).join(", ")})`,
    "",
  );
  if (t?.summary) lines.push(t.summary, "");
  if (issue.telemetry) {
    const { prev, cur } = issue.telemetry;
    lines.push(
      "### Telemetry",
      "",
      `| Metric | ${prev.patch} | ${cur.patch} |`,
      "|---|---|---|",
      `| Completion rate | ${fmt.pct(prev.completion_rate)} | ${fmt.pct(cur.completion_rate)} |`,
      `| Deaths / player | ${fmt.dec(prev.deaths_per_player)} | ${fmt.dec(cur.deaths_per_player)} |`,
      `| Restarts / player | ${fmt.dec(prev.restarts_per_player)} | ${fmt.dec(cur.restarts_per_player)} |`,
      `| Error reports | ${prev.error_reports} | ${cur.error_reports} |`,
      "",
    );
  }
  if (issue.telemetry_evidence) lines.push(`> ${issue.telemetry_evidence}`, "");
  if (t?.suspected_cause) lines.push("### Suspected cause", "", t.suspected_cause, "");
  const steps = t?.repro_steps ?? issue.repro_steps ?? [];
  if (steps.length) {
    lines.push("### Repro steps (inferred from player reports)", "");
    steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push("");
  }
  if (t?.evidence?.length) {
    lines.push("### Player evidence", "");
    for (const e of t.evidence) {
      lines.push(`> ${e.text}`);
      if (e.english && e.english !== e.text) lines.push(`> _${e.english}_`);
      lines.push("");
    }
  }
  lines.push(`_Generated by PlayerPulse · ${result.model}_`);
  return lines.join("\n");
}

function CopyButton({ issue, result }: { issue: Issue; result: RunResult }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(toMarkdown(issue, result));
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied" : "Copy as GitHub issue"}
    </Button>
  );
}

function IssueCard({ issue, result }: { issue: Issue; result: RunResult }) {
  const t = issue.ticket;
  const steps = t?.repro_steps ?? issue.repro_steps ?? [];
  return (
    <Card data-card className="relative gap-0 rounded-[10px] py-0">
      <Stamp tone="loss">VERIFIED · #{issue.priority ?? "–"}</Stamp>
      <CardHeader className="gap-5 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0 space-y-2.5">
          <CardDescription className="pr-36 text-xs">{whereLabel(issue, result.unit)}</CardDescription>
          <CardTitle
            role="heading"
            aria-level={3}
            className="max-w-[34ch] pr-28 text-xl leading-tight font-semibold tracking-tight text-balance sm:pr-0"
          >
            {t?.title ?? issue.title}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={issue.category} />
            <SeverityBadge severity={t?.severity} />
          </div>
        </div>
        <div className="flex shrink-0 items-end gap-8 sm:text-right">
          <div>
            <div className="font-serif text-[clamp(2.4rem,4.5vw,3.2rem)] leading-none font-semibold tracking-[-0.02em] text-loss tabular-nums lining-nums">
              {fmt.int(issue.players_lost_estimate)}
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">players lost</div>
          </div>
          <div>
            <div className="font-mono text-2xl leading-none tabular-nums">{issue.message_ids.length}</div>
            <div className="mt-1.5 text-xs text-muted-foreground">
              reports · {issue.distinct_players} players
            </div>
          </div>
        </div>
      </CardHeader>

      <Separator />
      <CardContent className="grid gap-6 p-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Telemetry</h4>
            <ChartLegendInline />
          </div>
          <TelemetryChart telemetry={issue.telemetry} />
          {issue.telemetry_evidence && <p className="text-sm text-muted-foreground">{issue.telemetry_evidence}</p>}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Reported in</span>
            <LanguageChips languages={issue.languages} />
          </div>
        </section>
        <section className="space-y-4 text-sm">
          {t?.summary && <p className="leading-relaxed">{t.summary}</p>}
          {t?.suspected_cause && (
            <div>
              <h4 className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Suspected cause</h4>
              <p className="leading-relaxed text-muted-foreground">{t.suspected_cause}</p>
            </div>
          )}
          {steps.length > 0 && (
            <div>
              <h4 className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Repro steps <span className="normal-case tracking-normal text-muted-foreground/70">· inferred from player reports</span>
              </h4>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground marker:tabular-nums">
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </CardContent>

      {t?.evidence && t.evidence.length > 0 && (
        <>
          <Separator />
          <CardContent className="p-6">
          <h4 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">What players said</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {t.evidence.map((e) => (
              <figure key={e.id} className="border-l-2 border-border py-1 pl-3 text-sm">
                <blockquote className="text-[15px] leading-relaxed">“{e.text}”</blockquote>
                {e.english && e.english !== e.text && (
                  <figcaption className="mt-1.5 leading-relaxed text-muted-foreground">{e.english}</figcaption>
                )}
              </figure>
            ))}
          </div>
          </CardContent>
        </>
      )}

      <CardFooter className="justify-end bg-transparent px-6 py-3">
        <CopyButton issue={issue} result={result} />
      </CardFooter>
    </Card>
  );
}

const ALL = "all";

export function IssuesView({ result }: { result: RunResult }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [severity, setSeverity] = useState<string>(ALL);
  const [level, setLevel] = useState<string>(ALL);
  const [view, setView] = useState<"cards" | "table">("cards");

  const all = result.issues
    .filter((i) => i.status === "reported")
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  const needle = q.trim().toLowerCase();
  const issues = all.filter(
    (i) =>
      (category === ALL || i.category === category) &&
      (severity === ALL || i.ticket?.severity === severity) &&
      (level === ALL || String(i.level) === level) &&
      (!needle ||
        [i.title, i.ticket?.title, i.ticket?.summary, i.mechanic, i.level_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)),
  );

  const catItems = [{ value: ALL, label: "All categories" }, ...["bug", "balance"].map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))];
  const sevItems = [
    { value: ALL, label: "Any severity" },
    ...[...new Set(all.map((i) => i.ticket?.severity).filter(Boolean) as string[])].map((s) => ({
      value: s,
      label: s[0].toUpperCase() + s.slice(1),
    })),
  ];
  const lvlItems = [
    { value: ALL, label: `Any ${result.unit}` },
    ...[...new Set(all.map((i) => i.level).filter((l): l is number => l != null))]
      .sort((a, b) => a - b)
      .map((l) => ({ value: String(l), label: `${l} · ${result.levels?.[String(l)] ?? result.unit}` })),
  ];
  const filtered = issues.length !== all.length;

  return (
    <div className="space-y-5">
      {all.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="min-w-48 flex-1">
            <InputGroupInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search issues"
              aria-label="Search issues"
            />
            <InputGroupAddon>
              <SearchIcon className="size-3.5" />
            </InputGroupAddon>
          </InputGroup>
          <FilterSelect items={catItems} value={category} onChange={setCategory} label="Category" />
          <FilterSelect items={sevItems} value={severity} onChange={setSeverity} label="Severity" />
          <FilterSelect items={lvlItems} value={level} onChange={setLevel} label={result.unit} />
          <ToggleGroup
            aria-label="View"
            size="sm"
            spacing={0}
            className="h-9 bg-muted p-[3px] *:h-[30px]"
            value={[view]}
            onValueChange={(v) => {
              const next = v[0];
              if (next === "cards" || next === "table") setView(next);
            }}
          >
            {(
              [
                ["cards", LayoutGridIcon, "Card view"],
                ["table", ListIcon, "Table view"],
              ] as const
            ).map(([v, Icon, label]) => (
              <Tooltip key={v}>
                <TooltipTrigger
                  render={
                    <ToggleGroupItem
                      value={v}
                      aria-label={label}
                      className="rounded-md! px-2 text-muted-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
                    />
                  }
                >
                  <Icon className="size-4" />
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>
        </div>
      )}
      {filtered && (
        <p className="text-xs text-muted-foreground">
          Showing {issues.length} of {all.length} issues
        </p>
      )}
      {all.length === 0 ? (
        <ViewEmpty title="No verified issues in this run" body="Nothing players reported was confirmed as a real problem." />
      ) : issues.length === 0 ? (
        <ViewEmpty title="No issues match these filters" icon={SearchXIcon} />
      ) : view === "table" ? (
        <IssuesTable issues={issues} result={result} />
      ) : (
        issues.map((i, idx) => <IssueCard key={`${i.title}-${idx}`} issue={i} result={result} />)
      )}
      <p className="text-xs text-muted-foreground">
        Priority = players who started the level on the new patch × drop in completion rate
      </p>
    </div>
  );
}

function FilterSelect({
  items,
  value,
  onChange,
  label,
}: {
  items: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <Select items={items} value={value} onValueChange={(v) => v && onChange(v as string)}>
      <SelectTrigger className="min-w-36" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function IssuesTable({ issues, result }: { issues: Issue[]; result: RunResult }) {
  return (
    <Card data-card className="gap-0 rounded-[10px] py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 pl-5">#</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead className="w-44">Where</TableHead>
            <TableHead className="w-40">Type</TableHead>
            <TableHead className="w-20 text-right">Reports</TableHead>
            <TableHead className="w-28 pr-5 text-right">Players lost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((i, idx) => (
            <TableRow key={idx}>
              <TableCell className="pl-5 text-xs tabular-nums text-muted-foreground">{i.priority ?? "–"}</TableCell>
              <TableCell className="max-w-md font-medium whitespace-normal">{i.ticket?.title ?? i.title}</TableCell>
              <TableCell className="text-muted-foreground">{whereLabel(i, result.unit)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <CategoryBadge category={i.category} />
                  <SeverityBadge severity={i.ticket?.severity} />
                </div>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">{i.message_ids.length}</TableCell>
              <TableCell className="pr-5 text-right font-mono text-loss tabular-nums">
                {fmt.int(i.players_lost_estimate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
