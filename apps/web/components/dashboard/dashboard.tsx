"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EyeIcon, InboxIcon, ListChecksIcon, MessagesSquareIcon, ScaleIcon, SirenIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api, fmt, type RunDetail, type RunResult, type RunRow } from "@/lib/api";
import { DismissedView } from "./dismissed-view";
import { IssuesView } from "./issues-view";
import { MessagesView, ReviewView } from "./messages-view";
import { NewRunButton } from "./new-run-dialog";
import { CardsSkeleton, EmptyState, ErrorState } from "./states";
import { TasksView } from "./tasks-view";
import { Reveal } from "./case-file";

type Section = "issues" | "dismissed" | "tasks" | "review" | "messages";

const SECTIONS: { id: Section; label: string; icon: typeof SirenIcon; blurb: string }[] = [
  { id: "issues", label: "Issues", icon: SirenIcon, blurb: "Verified problems, ranked by players lost." },
  {
    id: "dismissed",
    label: "Dismissed with proof",
    icon: ScaleIcon,
    blurb: "Complaints the telemetry settled, plus what we're keeping an eye on.",
  },
  { id: "tasks", label: "Tasks", icon: ListChecksIcon, blurb: "Work items created from verified issues." },
  { id: "review", label: "Needs a human look", icon: EyeIcon, blurb: "Messages the model wasn't confident about." },
  { id: "messages", label: "Messages", icon: MessagesSquareIcon, blurb: "Every player message in this run." },
];

function counts(r: RunResult | null | undefined): Partial<Record<Section, number>> {
  if (!r) return {};
  return {
    issues: r.issues.filter((i) => i.status === "reported").length,
    dismissed: r.issues.filter((i) => i.status !== "reported").length,
    review: r.messages.filter((m) => m.needs_review).length,
    messages: r.messages.length,
  };
}

function runLabel(r: RunRow) {
  return `${r.name || `Scenario ${r.scenario}`} · ${r.telemetry ? "telemetry" : "community only"} · ${fmt.date(r.createdAt)}`;
}

export function Dashboard() {
  const [section, setSection] = useState<Section>("issues");
  const [runs, setRuns] = useState<RunRow[] | null>(null);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<RunDetail | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const loadRuns = useCallback((select?: string) => {
    setRunsError(null);
    api
      .runs()
      .then((rs) => {
        setRuns(rs);
        setRunId((cur) => select ?? cur ?? rs[0]?.id ?? null);
      })
      .catch((e: Error) => setRunsError(e.message));
  }, []);

  useEffect(() => loadRuns(), [loadRuns]);

  const loadRun = useCallback(() => {
    if (!runId) return;
    setRun(null);
    setRunError(null);
    api
      .run(runId)
      .then(setRun)
      .catch((e: Error) => setRunError(e.message));
  }, [runId]);

  useEffect(loadRun, [loadRun]);

  const result = run?.result ?? null;
  const c = counts(result);
  const current = SECTIONS.find((s) => s.id === section)!;
  const runItems = runs?.map((r) => ({ value: r.id, label: runLabel(r) })) ?? [];

  let body: React.ReactNode;
  if (runsError) body = <ErrorState message={runsError} onRetry={() => loadRuns()} />;
  else if (!runs) body = <CardsSkeleton />;
  else if (runs.length === 0)
    body = (
      <EmptyState
        title="No runs yet"
        body="Start a run to analyse player messages for a scenario. Results show up here when it finishes."
      />
    );
  else if (runError) body = <ErrorState message={runError} onRetry={loadRun} />;
  else if (!run) body = <CardsSkeleton />;
  else if (!result)
    body = (
      <EmptyState
        title={run.status === "failed" ? "This run failed" : "This run has no results yet"}
        body={`Status: ${run.status}. Pick another run or start a new one.`}
      />
    );
  else if (section === "issues") body = <IssuesView result={result} />;
  else if (section === "dismissed") body = <DismissedView result={result} />;
  else if (section === "tasks") body = <TasksView runId={run.id} unit={result.unit} />;
  else if (section === "review") body = <ReviewView result={result} />;
  else body = <MessagesView result={result} />;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader className="px-4 py-4">
            <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <span className="size-2 shrink-0 rounded-full bg-watch shadow-[0_0_0_3px_rgba(255,178,36,0.16)]" />
              <span className="font-serif text-[19px] font-semibold tracking-[-0.01em] group-data-[collapsible=icon]:hidden">
                PlayerPulse
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="font-mono">{result ? result.game : "Run"}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {SECTIONS.map((s) => (
                    <SidebarMenuItem key={s.id}>
                      <SidebarMenuButton
                        isActive={section === s.id}
                        tooltip={s.label}
                        onClick={() => setSection(s.id)}
                      >
                        <s.icon />
                        <span>{s.label}</span>
                      </SidebarMenuButton>
                      {c[s.id] != null && <SidebarMenuBadge className="font-mono tabular-nums">{c[s.id]}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-4 pb-4 font-serif text-sm leading-relaxed text-muted-foreground italic group-data-[collapsible=icon]:hidden">
            Telemetry knows where. Players know why.
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-h-svh">
          <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-foreground/9 bg-card/70 px-4 py-3 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)] backdrop-blur-xl backdrop-saturate-[1.4] sm:px-6">
            <SidebarTrigger />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-serif text-[22px] leading-tight font-medium tracking-[-0.02em]">{current.label}</h1>
              <p className="truncate font-mono text-[11.5px] text-muted-foreground">{current.blurb}</p>
            </div>
            {runs && runs.length > 0 && (
              <Select items={runItems} value={runId} onValueChange={(v) => v && setRunId(v as string)}>
                <SelectTrigger size="sm" className="max-w-[22rem]" aria-label="Select run">
                  <SelectValue placeholder="Select a run" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {runs.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {runLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <NewRunButton onCreated={(id) => loadRuns(id)} />
          </header>

          <Reveal deps={[section, run]} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
            {body}
          </Reveal>

          <RunFooter run={run} result={result} />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function RunFooter({ run, result }: { run: RunDetail | null; result: RunResult | null }) {
  if (!run) {
    return (
      <footer className="border-t border-border px-6 py-3">
        <Skeleton className="h-4 w-80" />
      </footer>
    );
  }
  const m = result?.meta;
  const items: [string, string][] = [
    ["Model", m?.model ?? run.model],
    ["Cost", fmt.usd(m?.cost_usd ?? run.costUsd)],
    ["Tokens in / out", m ? `${fmt.int(m.tokens_in)} / ${fmt.int(m.tokens_out)}` : "–"],
    ["Time", `${fmt.dec(m?.seconds ?? run.seconds)}s`],
    ["Messages", fmt.int(m?.messages_processed ?? run.messagesProcessed)],
    ["Cached calls", m ? `${fmt.int(m.cache_hits)} of ${fmt.int(m.llm_calls)}` : "–"],
  ];
  return (
    <footer className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border px-4 py-3 font-mono text-[11.5px] sm:px-6">
      <InboxIcon className="hidden size-3.5 self-center text-muted-foreground sm:block" />
      {items.map(([k, v]) => (
        <span key={k}>
          <span className="text-muted-foreground">{k} </span>
          <span className="font-mono tabular-nums">{v}</span>
        </span>
      ))}
    </footer>
  );
}
