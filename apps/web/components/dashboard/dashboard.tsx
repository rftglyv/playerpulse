"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InboxIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api, fmt, type RunDetail, type RunResult, type RunRow } from "@/lib/api";
import { DismissedView } from "./dismissed-view";
import { IssuesView } from "./issues-view";
import { ReviewView } from "./messages-view";
import { OverviewView } from "./overview-view";
import { PatchCompareView } from "./patch-compare-view";
import { VoicesView } from "./voices-view";
import { NewRunButton } from "./new-run-dialog";
import { CardsSkeleton, EmptyState, ErrorState } from "./states";
import { TasksView } from "./tasks-view";
import { Reveal } from "./case-file";
import { SECTIONS, isSection, sectionHref, type Section } from "./sections";

function counts(r: RunResult | null | undefined): Partial<Record<Section, number>> {
  if (!r) return {};
  return {
    issues: r.issues.filter((i) => i.status === "reported").length,
    dismissed: r.issues.filter((i) => i.status !== "reported").length,
    review: r.messages.filter((m) => m.needs_review).length,
    voices: r.messages.length,
  };
}

function runLabel(r: RunRow) {
  return `${r.name || `Scenario ${r.scenario}`} · ${r.telemetry ? "telemetry" : "community only"} · ${fmt.date(r.createdAt)}`;
}

interface DashboardCtx {
  runs: RunRow[] | null;
  runsError: string | null;
  loadRuns: () => void;
  runId: string | null;
  run: RunDetail | null;
  runError: string | null;
  loadRun: (force?: boolean) => void;
}

// The shell lives in app/dashboard/[section]/layout.tsx and remounts per section, so keep fetched data
// at module scope: section switches reuse it instead of refetching.
const cache: { runs: RunRow[] | null; run: Map<string, RunDetail> } = { runs: null, run: new Map() };

const Ctx = createContext<DashboardCtx | null>(null);

function useDashboard() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDashboard must be used inside DashboardShell");
  return c;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const seg = pathname.split("/")[2] ?? "overview";
  const section: Section = isSection(seg) ? seg : "overview";

  const [runs, setRuns] = useState<RunRow[] | null>(cache.runs);
  const [runsError, setRunsError] = useState<string | null>(null);
  const initialRunId = searchParams.get("run") ?? cache.runs?.[0]?.id ?? null;
  const [run, setRun] = useState<RunDetail | null>(initialRunId ? (cache.run.get(initialRunId) ?? null) : null);
  const [runError, setRunError] = useState<string | null>(null);

  const runId = searchParams.get("run") ?? runs?.[0]?.id ?? null;

  const selectRun = useCallback(
    (id: string) => router.replace(sectionHref(section, id), { scroll: false }),
    [router, section],
  );

  const loadRuns = useCallback(() => {
    setRunsError(null);
    api
      .runs()
      .then((rs) => {
        cache.runs = rs;
        setRuns(rs);
      })
      .catch((e: Error) => setRunsError(e.message));
  }, []);

  useEffect(() => {
    if (!cache.runs) loadRuns();
  }, [loadRuns]);

  const loadRun = useCallback(
    (force = false) => {
      if (!runId) return;
      const hit = cache.run.get(runId);
      setRunError(null);
      if (hit && !force) {
        setRun(hit);
        return;
      }
      setRun((cur) => (cur?.id === runId ? cur : null));
      api
        .run(runId)
        .then((r) => {
          // Only cache finished runs; pending ones should refresh on the next visit.
          if (r.result) cache.run.set(r.id, r);
          setRun(r);
        })
        .catch((e: Error) => setRunError(e.message));
    },
    [runId],
  );

  useEffect(() => loadRun(), [loadRun]);

  const result = run?.id === runId ? (run?.result ?? null) : null;
  const c = counts(result);
  const current = SECTIONS.find((s) => s.id === section)!;
  const runItems = runs?.map((r) => ({ value: r.id, label: runLabel(r) })) ?? [];
  const ctx = useMemo<DashboardCtx>(
    () => ({ runs, runsError, loadRuns, runId, run: run?.id === runId ? run : null, runError, loadRun }),
    [runs, runsError, loadRuns, runId, run, runError, loadRun],
  );

  return (
    <Ctx.Provider value={ctx}>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar section={section} runId={runId} counts={c} game={result?.game ?? run?.game} />

          <SidebarInset className="min-h-svh">
            <SiteHeader title={current.label} description={current.blurb}>
              {runs && runs.length > 0 && (
                <Select items={runItems} value={runId} onValueChange={(v) => v && selectRun(v as string)}>
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
              <NewRunButton
                onCreated={(id) => {
                  loadRuns();
                  selectRun(id);
                }}
              />
            </SiteHeader>

            <Reveal deps={[section, run]} className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-16 sm:px-6">
              {children}
            </Reveal>

            <RunFooter run={ctx.run} result={result} />
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </Ctx.Provider>
  );
}

export function SectionBody({ section }: { section: Section }) {
  const { runs, runsError, loadRuns, run, runError, loadRun, runId } = useDashboard();
  const result = run?.result ?? null;

  if (runsError) return <ErrorState message={runsError} onRetry={loadRuns} />;
  if (!runs) return <CardsSkeleton />;
  if (runs.length === 0)
    return (
      <EmptyState
        title="No runs yet"
        body="Start a run to analyse player messages for a scenario. Results show up here when it finishes."
      />
    );
  if (runError) return <ErrorState message={runError} onRetry={() => loadRun(true)} />;
  if (!run) return <CardsSkeleton />;
  if (!result)
    return (
      <EmptyState
        title={run.status === "failed" ? "This run failed" : "This run has no results yet"}
        body={`Status: ${run.status}. Pick another run or start a new one.`}
      />
    );
  switch (section) {
    case "overview":
      return <OverviewView result={result} issuesHref={sectionHref("issues", runId)} />;
    case "patch-compare":
      return <PatchCompareView result={result} />;
    case "issues":
      return <IssuesView result={result} />;
    case "dismissed":
      return <DismissedView result={result} />;
    case "tasks":
      return <TasksView runId={run.id} unit={result.unit} />;
    case "review":
      return <ReviewView result={result} />;
    default:
      return <VoicesView result={result} />;
  }
}

function RunFooter({ run, result }: { run: RunDetail | null; result: RunResult | null }) {
  if (!run) {
    return (
      <footer className="sticky bottom-0 z-10 border-t border-border bg-[rgba(255,255,255,0.72)] backdrop-blur-xl backdrop-saturate-[1.4] shadow-[0_-1px_2px_rgba(0,0,0,0.03),0_-12px_32px_-20px_rgba(0,0,0,0.18)] px-6 py-3">
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
    <footer className="sticky bottom-0 z-10 border-t border-border bg-[rgba(255,255,255,0.72)] backdrop-blur-xl backdrop-saturate-[1.4] shadow-[0_-1px_2px_rgba(0,0,0,0.03),0_-12px_32px_-20px_rgba(0,0,0,0.18)] flex flex-wrap gap-x-6 gap-y-1 px-4 py-3 font-mono text-[11.5px] sm:px-6">
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
