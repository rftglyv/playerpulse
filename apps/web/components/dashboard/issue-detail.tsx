"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, SearchXIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, fmt, langLabel, type Issue, type RunMessage, type RunResult, type Task, type TaskState } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Stamp } from "./case-file";
import { CategoryBadge, CopyButton, LanguageChips, SeverityBadge, ViewEmpty, whereLabel } from "./issues-view";
import { issueHref, sectionHref } from "./sections";
import { TASK_STATES } from "./tasks-view";
import { ChartLegendInline, TelemetryChart } from "./telemetry-chart";
import { CHANNEL_LABEL, ChannelIcon } from "./voices-view";

const STAMP: Record<Issue["status"], { tone: "loss" | "proof" | "watch"; label: string }> = {
  reported: { tone: "loss", label: "VERIFIED" },
  dismissed: { tone: "proof", label: "DISMISSED" },
  watch: { tone: "watch", label: "WATCH" },
};

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
      {hint && <span className="normal-case tracking-normal text-muted-foreground/70"> · {hint}</span>}
    </h2>
  );
}

export function IssueDetail({ result, index, runId }: { result: RunResult; index: number; runId: string }) {
  const issue = result.issues[index];
  const issuesHref = sectionHref("issues", runId);
  if (!issue)
    return (
      <div className="space-y-4">
        <ViewEmpty icon={SearchXIcon} title={`Issue #${index + 1} isn't in this run`} body="Pick another run or go back to the issue list." />
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={issuesHref} />}>
          <ArrowLeftIcon /> Back to issues
        </Button>
      </div>
    );

  const t = issue.ticket;
  const title = t?.title ?? issue.title;
  const n = index + 1;
  const total = result.issues.length;
  const stamp = STAMP[issue.status] ?? STAMP.reported;
  const steps = t?.repro_steps ?? issue.repro_steps ?? [];

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <Breadcrumb className="min-w-0 max-w-full">
          <BreadcrumbList className="min-w-0 flex-nowrap">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={issuesHref} />}>Issues</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="block max-w-[40ch] min-w-0 truncate">
                <span className="font-mono">#{issue.priority ?? n}</span> {title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={issuesHref} />}>
            <ArrowLeftIcon /> Back to issues
          </Button>
          <ButtonGroup aria-label="Previous or next issue">
            <Button
              variant="outline"
              size="sm"
              disabled={n <= 1}
              aria-label="Previous issue"
              render={n > 1 ? <Link href={issueHref(n - 1, runId)} /> : undefined}
              nativeButton={n <= 1}
            >
              <ChevronLeftIcon /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={n >= total}
              aria-label="Next issue"
              render={n < total ? <Link href={issueHref(n + 1, runId)} /> : undefined}
              nativeButton={n >= total}
            >
              Next <ChevronRightIcon />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <Card data-card className="relative min-w-0 gap-0 rounded-[10px] py-0">
        <Stamp tone={stamp.tone}>
          {stamp.label} · #{issue.priority ?? "–"}
        </Stamp>
        <CardHeader className="gap-5 p-6 min-w-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0 space-y-2.5">
            <CardDescription className="pr-36 text-xs">
              Priority <span className="font-mono">#{issue.priority ?? "–"}</span> · {whereLabel(issue, result.unit)}
            </CardDescription>
            <CardTitle
              role="heading"
              aria-level={2}
              className="max-w-[40ch] pr-28 text-2xl leading-tight font-semibold tracking-tight text-balance break-words sm:pr-0"
            >
              {title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <CategoryBadge category={issue.category} />
              <SeverityBadge severity={t?.severity} />
              <Badge variant="secondary" className="text-[11px] capitalize">
                {issue.status}
              </Badge>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-end gap-8 sm:text-right">
            <div>
              <div className="font-serif text-[clamp(2.6rem,5vw,3.6rem)] leading-none font-semibold tracking-[-0.02em] text-loss tabular-nums lining-nums">
                {fmt.int(issue.players_lost_estimate)}
              </div>
              <div className="mt-1.5 text-xs text-muted-foreground">players lost</div>
            </div>
            <div>
              <div className="font-mono text-2xl leading-none tabular-nums">{issue.message_ids.length}</div>
              <div className="mt-1.5 text-xs text-muted-foreground">reports · {issue.distinct_players} players</div>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="flex min-w-0 flex-wrap items-center gap-x-8 gap-y-3 p-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Languages</span>
            <LanguageChips languages={issue.languages} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">First report </span>
            <span className="font-mono tabular-nums">{issue.first_report ? fmt.date(issue.first_report) : "–"}</span>
            {issue.hours_after_patch != null && (
              <span className="text-muted-foreground">
                {" "}
                · <span className="font-mono tabular-nums">{fmt.dec(issue.hours_after_patch)}</span> h after patch
              </span>
            )}
          </div>
          {issue.mechanic && (
            <div>
              <span className="text-xs text-muted-foreground">Mechanic </span>
              {issue.mechanic}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {t ? (
          <Card data-card className="min-w-0 rounded-[10px]">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Ticket</CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                Severity <SeverityBadge severity={t.severity} />
              </CardDescription>
              <CardAction>
                <CopyButton issue={issue} result={result} />
              </CardAction>
            </CardHeader>
            <CardContent className="min-w-0 space-y-4 text-sm break-words">
              {t.summary && <p className="leading-relaxed">{t.summary}</p>}
              {t.suspected_cause && (
                <div className="space-y-1.5">
                  <SectionTitle>Suspected cause</SectionTitle>
                  <p className="leading-relaxed text-muted-foreground">{t.suspected_cause}</p>
                </div>
              )}
              {steps.length > 0 && (
                <div className="space-y-1.5">
                  <SectionTitle hint="inferred from player reports">Repro steps</SectionTitle>
                  <ol className="list-decimal space-y-1 pl-5 text-muted-foreground marker:tabular-nums">
                    {steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <ViewEmpty title="No ticket for this issue" body="Tickets are written only for verified issues." />
        )}

        <div className="min-w-0 space-y-6">
          <Card data-card className="min-w-0 rounded-[10px]">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Telemetry</CardTitle>
              <CardAction>
                <ChartLegendInline tone={stamp.tone} />
              </CardAction>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3 overflow-x-auto">
              <TelemetryChart telemetry={issue.telemetry} tone={stamp.tone} />
              {issue.telemetry_evidence && <p className="text-sm text-muted-foreground">{issue.telemetry_evidence}</p>}
            </CardContent>
          </Card>
          <TaskCard issue={issue} runId={runId} />
        </div>
      </div>

      <Evidence issue={issue} messages={result.messages} />
    </div>
  );
}

function TaskCard({ issue, runId }: { issue: Issue; runId: string }) {
  const [task, setTask] = useState<Task | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setTask(undefined);
    api
      .tasks(runId)
      .then((ts) => {
        if (!live) return;
        // Tasks carry the issue's own title/level (not the ticket title).
        const hit =
          ts.find((t) => t.title === issue.title && t.level === issue.level) ??
          ts.find((t) => t.title === issue.title) ??
          null;
        setTask(hit);
      })
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [runId, issue.title, issue.level]);

  async function changeState(state: TaskState) {
    if (!task || task.state === state) return;
    const before = task.state;
    setError(null);
    setTask({ ...task, state });
    try {
      await api.patchTask(task.id, { state });
    } catch (e) {
      setTask((cur) => (cur ? { ...cur, state: before } : cur));
      setError(e instanceof Error ? e.message : "Couldn't update the task");
    }
  }

  return (
    <Card data-card className="min-w-0 rounded-[10px]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Task</CardTitle>
        <CardDescription>
          {task ? (
            <>
              <span className="font-mono">{task.id.slice(0, 8)}</span>
              {task.assignee ? ` · ${task.assignee}` : " · unassigned"}
            </>
          ) : task === null ? (
            "No task was created for this issue."
          ) : (
            "Loading…"
          )}
        </CardDescription>
        {task && (
          <CardAction>
            <Select
              items={TASK_STATES}
              value={task.state}
              onValueChange={(v) => v && changeState(v as TaskState)}
            >
              <SelectTrigger size="sm" className="min-w-36" aria-label="Task state">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {TASK_STATES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        )}
      </CardHeader>
      {(task === undefined && !error) || error || (task && task.tags.length > 0) ? (
        <CardContent className="space-y-2">
          {task === undefined && !error && <Skeleton className="h-5 w-40" />}
          {error && <p className="text-sm text-loss">{error}</p>}
          {task && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[11px] font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}

function Evidence({ issue, messages }: { issue: Issue; messages: RunMessage[] }) {
  const byId = new Map(messages.map((m) => [m.id, m]));
  const ticketIds = new Set(issue.ticket?.evidence?.map((e) => e.id) ?? []);
  const rows = issue.message_ids
    .map((id) => byId.get(id))
    .filter((m): m is RunMessage => !!m)
    .sort((a, b) => Number(ticketIds.has(b.id)) - Number(ticketIds.has(a.id)));

  return (
    <section className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Evidence</h2>
        <p className="text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{rows.length}</span> messages
          {ticketIds.size > 0 && " · quoted in the ticket first"}
        </p>
      </div>
      {rows.length === 0 ? (
        <ViewEmpty title="No messages attached" />
      ) : (
        <Card data-card className="min-w-0 gap-0 overflow-hidden rounded-[10px] py-0">
          <Table className="min-w-[56rem]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 pl-5">ID</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Channel</span>
                </TableHead>
                <TableHead className="w-24">Lang</TableHead>
                <TableHead className="w-36">Time</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>English</TableHead>
                <TableHead className="w-24 pr-5 text-right">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => {
                const quoted = ticketIds.has(m.id);
                return (
                  <TableRow key={m.id} className={cn("align-top", quoted && "bg-loss/[0.04]")}>
                    <TableCell className="pl-5 font-mono text-xs text-muted-foreground">
                      {m.id}
                      {quoted && (
                        <Badge variant="outline" className="mt-1 block w-fit border-loss/30 text-[10px] text-loss">
                          in ticket
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell title={CHANNEL_LABEL[m.channel] ?? m.channel}>
                      <ChannelIcon channel={m.channel} className="size-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{langLabel(m.language)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                      {fmt.date(m.timestamp)}
                    </TableCell>
                    <TableCell className="max-w-sm whitespace-normal">
                      {m.text}
                      {m.sarcastic && (
                        <Badge variant="outline" className="ml-1.5 border-watch/30 text-[10px] text-watch">
                          sarcastic
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
                      {m.english_translation && m.english_translation !== m.text ? m.english_translation : "–"}
                    </TableCell>
                    <TableCell
                      className={cn("pr-5 text-right font-mono tabular-nums", m.confidence < 0.6 && "text-watch")}
                    >
                      {Math.round(m.confidence * 100)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </section>
  );
}
