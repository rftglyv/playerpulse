"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownIcon, GripVerticalIcon, KanbanSquareIcon, ListIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, fmt, type Task, type TaskState } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/reui/kanban";
import { CategoryBadge, SeverityBadge } from "./issues-view";
import { EmptyState, ErrorState } from "./states";

const STATES: { value: TaskState; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "wont_fix", label: "Won't fix" },
];

function pTag(t: Task) {
  const tag = t.tags?.[0];
  return tag && /^P\d$/i.test(tag) ? tag.toUpperCase() : "—";
}

function PTagChip({ tag }: { tag: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-8 items-center justify-center rounded-md px-1.5 font-mono text-xs font-semibold",
        tag === "P0" && "bg-[#B91C1C]/10 text-[#B91C1C]",
        tag === "P1" && "bg-[#2563EB]/10 text-[#2563EB]",
        tag !== "P0" && tag !== "P1" && "bg-muted text-muted-foreground",
      )}
    >
      {tag}
    </span>
  );
}

type SortKey = "ptag" | "lost";

export function TasksView({ runId, unit }: { runId: string; unit: string }) {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("ptag");
  const [view, setView] = useState<"board" | "list">("board");

  const load = useCallback(() => {
    setError(null);
    setTasks(null);
    api
      .tasks(runId)
      .then(setTasks)
      .catch((e: Error) => setError(e.message));
  }, [runId]);

  useEffect(load, [load]);

  const groups = useMemo(() => {
    if (!tasks) return [];
    const sorted = [...tasks].sort((a, b) =>
      sort === "lost"
        ? (b.playersLost ?? 0) - (a.playersLost ?? 0)
        : pTag(a).localeCompare(pTag(b)) || (a.priority ?? 999) - (b.priority ?? 999),
    );
    if (sort === "lost") return [{ tag: null as string | null, items: sorted }];
    const map = new Map<string, Task[]>();
    for (const t of sorted) map.set(pTag(t), [...(map.get(pTag(t)) ?? []), t]);
    return [...map.entries()].map(([tag, items]) => ({ tag: tag as string | null, items }));
  }, [tasks, sort]);

  // Cross-column drops: the board already shows the new layout; persist each state change, roll back on failure.
  async function commitBoard(next: Record<TaskState, Task[]>) {
    if (!tasks) return;
    const moved: { task: Task; state: TaskState }[] = [];
    for (const col of STATES)
      for (const t of next[col.value]) if (t.state !== col.value) moved.push({ task: t, state: col.value });
    await Promise.all(moved.map((m) => setState(m.task, m.state)));
  }

  async function setState(task: Task, state: TaskState) {
    const before = task.state;
    if (before === state) return;
    setRowError(null);
    setTasks((ts) => ts?.map((t) => (t.id === task.id ? { ...t, state } : t)) ?? null);
    try {
      await api.patchTask(task.id, { state });
    } catch (e) {
      setTasks((ts) => ts?.map((t) => (t.id === task.id ? { ...t, state: before } : t)) ?? null);
      setRowError(`Couldn't update "${task.title}": ${(e as Error).message}`);
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!tasks) return <Skeleton className="h-72 w-full rounded-xl" />;
  if (tasks.length === 0)
    return (
      <EmptyState
        title="No tasks for this run"
        body="Tasks are created from verified issues. This run didn't produce any, or they haven't been synced yet."
      />
    );

  const SortHead = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <TableHead className={className}>
      <button
        onClick={() => setSort(k)}
        className={cn("inline-flex items-center gap-1 hover:text-foreground", sort === k && "text-foreground")}
      >
        {children}
        {sort === k && <ArrowDownIcon className="size-3" />}
      </button>
    </TableHead>
  );

  const toggle = (
    <div className="flex items-center justify-between gap-3">
      <p className="font-mono text-xs text-muted-foreground">
        {tasks.length} tasks · {tasks.filter((t) => t.state === "done").length} done
      </p>
      <div className="flex rounded-lg bg-muted p-[3px]" role="group" aria-label="View">
        {(
          [
            ["board", KanbanSquareIcon, "Board view"],
            ["list", ListIcon, "List view"],
          ] as const
        ).map(([v, Icon, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground",
              view === v && "bg-background text-foreground shadow-sm",
            )}
          >
            <Icon className="size-3.5" /> {label.split(" ")[0]}
          </button>
        ))}
      </div>
    </div>
  );

  if (view === "board")
    return (
      <div className="space-y-3">
        {toggle}
        {rowError && <p className="text-sm text-destructive">{rowError}</p>}
        <TaskBoard tasks={tasks} unit={unit} onCommit={commitBoard} />
      </div>
    );

  return (
    <div className="space-y-3">
      {toggle}
      {rowError && <p className="text-sm text-destructive">{rowError}</p>}
      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/8">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHead k="ptag" className="w-16">
                Tag
              </SortHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-28">Category</TableHead>
              <TableHead className="w-40">Level</TableHead>
              <SortHead k="lost" className="w-28 text-right">
                Players lost
              </SortHead>
              <TableHead className="w-40">State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <Fragment key={g.tag ?? "all"}>
                {g.tag && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={6} className="py-1.5 text-xs text-muted-foreground">
                      {g.tag === "—" ? "Untagged" : g.tag} · {g.items.length} {g.items.length === 1 ? "task" : "tasks"}
                    </TableCell>
                  </TableRow>
                )}
                {g.items.map((t) => (
                  <TableRow key={t.id} className={cn((t.state === "done" || t.state === "wont_fix") && "opacity-60")}>
                    <TableCell>
                      <PTagChip tag={pTag(t)} />
                    </TableCell>
                    <TableCell className="max-w-md whitespace-normal font-medium">
                      {t.title}
                      {t.tags.length > 1 && (
                        <span className="ml-2 inline-flex gap-1 align-middle">
                          {t.tags.slice(1).map((tag) => (
                            <span key={tag} className="rounded bg-muted px-1 text-[11px] font-normal text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={t.category} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.level == null ? "–" : `${t.levelName ?? unit} · ${t.level}`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmt.int(t.playersLost)}</TableCell>
                    <TableCell>
                      <Select
                        items={STATES}
                        value={t.state}
                        onValueChange={(v) => v && setState(t, v as TaskState)}
                      >
                        <SelectTrigger size="sm" className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type Columns = Record<TaskState, Task[]>;

function groupByState(tasks: Task[]): Columns {
  const sorted = [...tasks].sort(
    (a, b) => pTag(a).localeCompare(pTag(b)) || (b.playersLost ?? 0) - (a.playersLost ?? 0),
  );
  const cols = Object.fromEntries(STATES.map((s) => [s.value, [] as Task[]])) as Columns;
  for (const t of sorted) cols[t.state]?.push(t);
  return cols;
}

function TaskBoard({
  tasks,
  unit,
  onCommit,
}: {
  tasks: Task[];
  unit: string;
  onCommit: (next: Columns) => void;
}) {
  const [columns, setColumns] = useState<Columns>(() => groupByState(tasks));

  // Re-sync when task states change outside a drag (load, list-view edits, rollback).
  const signature = tasks.map((t) => `${t.id}:${t.state}`).join("|");
  const [synced, setSynced] = useState(signature);
  if (synced !== signature) {
    setSynced(signature);
    const placed = new Map<string, TaskState>();
    for (const col of STATES) for (const t of columns[col.value]) placed.set(t.id, col.value);
    // Only regroup if the board disagrees with the data (keeps manual ordering after a successful drop).
    if (tasks.some((t) => placed.get(t.id) !== t.state)) setColumns(groupByState(tasks));
  }

  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  return (
    <Kanban<Task>
      value={columns}
      onValueChange={(v) => setColumns(v as Columns)}
      getItemValue={(t) => t.id}
      onValueCommit={(v) => onCommit(v as Columns)}
      restoreOnCancel
    >
      <KanbanBoard className="grid auto-rows-auto items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATES.map((col) => (
          <KanbanColumn
            key={col.value}
            value={col.value}
            className="flex min-h-40 flex-col gap-3 rounded-xl border border-border/60 bg-muted/60 p-2.5"
          >
            <div className="flex items-center justify-between px-1.5 pt-0.5">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1.5 font-mono text-[11px] text-muted-foreground tabular-nums ring-1 ring-border">
                {columns[col.value].length}
              </span>
            </div>
            <KanbanColumnContent value={col.value} className="flex min-h-16 flex-col gap-2">
              {columns[col.value].map((t) => (
                <KanbanItem key={t.id} value={t.id}>
                  <TaskCard task={t} unit={unit} />
                </KanbanItem>
              ))}
              {columns[col.value].length === 0 && (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center font-mono text-[11px] text-muted-foreground">
                  Drop a card here
                </p>
              )}
            </KanbanColumnContent>
          </KanbanColumn>
        ))}
      </KanbanBoard>
      <KanbanOverlay>
        {({ value, variant }) => {
          const t = variant === "item" ? byId.get(String(value)) : null;
          return t ? <TaskCard task={t} unit={unit} overlay /> : null;
        }}
      </KanbanOverlay>
    </Kanban>
  );
}

function TaskCard({ task: t, unit, overlay }: { task: Task; unit: string; overlay?: boolean }) {
  return (
    <article
      className={cn(
        "group/card relative space-y-2.5 rounded-lg border border-border bg-background p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        overlay && "rotate-1 shadow-lg",
      )}
    >
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-sm leading-snug font-medium">{t.title}</p>
        <KanbanItemHandle
          render={<button type="button" aria-label={`Drag "${t.title}"`} />}
          className="-mt-0.5 -mr-1 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100 hover:bg-muted focus-visible:opacity-100"
        >
          <GripVerticalIcon className="size-4" />
        </KanbanItemHandle>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <PTagChip tag={pTag(t)} />
        <CategoryBadge category={t.category} />
        <SeverityBadge severity={t.severity} />
      </div>
      <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
        <span className="truncate">{t.level == null ? "–" : `${t.levelName ?? unit} · ${t.level}`}</span>
        {t.playersLost != null && t.playersLost > 0 && (
          <span className="text-loss tabular-nums">−{fmt.int(t.playersLost)} players</span>
        )}
      </div>
    </article>
  );
}
