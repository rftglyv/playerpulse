"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownIcon,
  GripVerticalIcon,
  KanbanSquareIcon,
  ListIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export const TASK_STATES: { value: TaskState; label: string }[] = [
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
    <Badge
      variant="secondary"
      className={cn(
        "min-w-8 rounded-md px-1.5 font-mono font-semibold tabular-nums",
        tag === "P0" && "bg-[#B91C1C]/10 text-[#B91C1C]",
        tag === "P1" && "bg-[#2563EB]/10 text-[#2563EB]",
        tag !== "P0" && tag !== "P1" && "bg-muted text-muted-foreground",
      )}
    >
      {tag}
    </Badge>
  );
}

type SortKey = "ptag" | "lost";

export function TasksView({ runId, unit }: { runId: string; unit: string }) {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("ptag");
  const [view, setView] = useState<"board" | "list">("board");
  const [saving, setSaving] = useState<Set<string>>(() => new Set());

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
        : pTag(a).localeCompare(pTag(b)) ||
          (a.priority ?? 999) - (b.priority ?? 999),
    );
    if (sort === "lost") return [{ tag: null as string | null, items: sorted }];
    const map = new Map<string, Task[]>();
    for (const t of sorted) map.set(pTag(t), [...(map.get(pTag(t)) ?? []), t]);
    return [...map.entries()].map(([tag, items]) => ({
      tag: tag as string | null,
      items,
    }));
  }, [tasks, sort]);

  // Cross-column drops: the board already shows the new layout; persist each state change, roll back on failure.
  async function commitBoard(next: Record<TaskState, Task[]>) {
    if (!tasks) return;
    const moved: { task: Task; state: TaskState }[] = [];
    for (const col of TASK_STATES)
      for (const t of next[col.value])
        if (t.state !== col.value) moved.push({ task: t, state: col.value });
    await Promise.all(moved.map((m) => setState(m.task, m.state)));
  }

  async function setState(task: Task, state: TaskState) {
    const before = task.state;
    if (before === state) return;
    setRowError(null);
    setTasks(
      (ts) => ts?.map((t) => (t.id === task.id ? { ...t, state } : t)) ?? null,
    );
    setSaving((s) => new Set(s).add(task.id));
    try {
      await api.patchTask(task.id, { state });
    } catch (e) {
      setTasks(
        (ts) =>
          ts?.map((t) => (t.id === task.id ? { ...t, state: before } : t)) ??
          null,
      );
      setRowError(`Couldn't update "${task.title}": ${(e as Error).message}`);
    } finally {
      setSaving((s) => {
        const n = new Set(s);
        n.delete(task.id);
        return n;
      });
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

  const SortHead = ({
    k,
    children,
    className,
  }: {
    k: SortKey;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => setSort(k)}
        aria-pressed={sort === k}
        className={cn(
          "-ml-2 font-medium text-muted-foreground",
          sort === k && "text-foreground",
        )}
      >
        {children}
        {sort === k && <ArrowDownIcon data-icon="inline-end" />}
      </Button>
    </TableHead>
  );

  const toggle = (
    <div className="flex items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          <span className="font-mono tabular-nums">{tasks.length}</span> tasks ·{" "}
          <span className="font-mono tabular-nums">
            {tasks.filter((t) => t.state === "done").length}
          </span>{" "}
          done
        </span>
        {saving.size > 0 && (
          <span className="flex items-center gap-1">
            <Spinner className="size-3" /> Saving
          </span>
        )}
      </p>
      <ToggleGroup
        variant="outline"
        size="sm"
        spacing={0}
        value={[view]}
        onValueChange={(v) => v[0] && setView(v[0] as "board" | "list")}
        aria-label="View"
      >
        {(
          [
            ["board", KanbanSquareIcon, "Board view"],
            ["list", ListIcon, "List view"],
          ] as const
        ).map(([v, Icon, label]) => (
          <ToggleGroupItem key={v} value={v} aria-label={label}>
            <Icon data-icon="inline-start" /> {label.split(" ")[0]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
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
                <Tooltip>
                  <TooltipTrigger render={<span />}>
                    Players lost
                  </TooltipTrigger>
                  <TooltipContent>
                    Click to sort by players lost
                  </TooltipContent>
                </Tooltip>
              </SortHead>
              <TableHead className="w-40">State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <Fragment key={g.tag ?? "all"}>
                {g.tag && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell
                      colSpan={6}
                      className="py-1.5 text-xs text-muted-foreground"
                    >
                      {g.tag === "—" ? "Untagged" : g.tag} · {g.items.length}{" "}
                      {g.items.length === 1 ? "task" : "tasks"}
                    </TableCell>
                  </TableRow>
                )}
                {g.items.map((t) => (
                  <TableRow
                    key={t.id}
                    className={cn(
                      (t.state === "done" || t.state === "wont_fix") &&
                        "opacity-60",
                    )}
                  >
                    <TableCell>
                      <PTagChip tag={pTag(t)} />
                    </TableCell>
                    <TableCell className="max-w-md whitespace-normal font-medium">
                      {t.title}
                      {t.tags.length > 1 && (
                        <span className="ml-2 inline-flex gap-1 align-middle">
                          {t.tags.slice(1).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="rounded px-1 font-normal"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={t.category} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.level == null
                        ? "–"
                        : `${t.levelName ?? unit} · ${t.level}`}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {fmt.int(t.playersLost)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          items={TASK_STATES}
                          value={t.state}
                          onValueChange={(v) =>
                            v && setState(t, v as TaskState)
                          }
                        >
                          <SelectTrigger size="sm" className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TASK_STATES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {saving.has(t.id) && (
                          <Spinner className="size-3.5 text-muted-foreground" />
                        )}
                      </div>
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
    (a, b) =>
      pTag(a).localeCompare(pTag(b)) ||
      (b.playersLost ?? 0) - (a.playersLost ?? 0),
  );
  const cols = Object.fromEntries(
    TASK_STATES.map((s) => [s.value, [] as Task[]]),
  ) as Columns;
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
    for (const col of TASK_STATES)
      for (const t of columns[col.value]) placed.set(t.id, col.value);
    // Only regroup if the board disagrees with the data (keeps manual ordering after a successful drop).
    if (tasks.some((t) => placed.get(t.id) !== t.state))
      setColumns(groupByState(tasks));
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
        {TASK_STATES.map((col) => (
          <KanbanColumn
            key={col.value}
            value={col.value}
            className="flex min-h-40 flex-col gap-3 rounded-xl border border-border/60 bg-muted/60 p-2.5"
          >
            <div className="flex items-center justify-between px-1.5 pt-0.5">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <Badge
                variant="outline"
                className="min-w-5 bg-background px-1.5 font-mono text-[11px] text-muted-foreground tabular-nums"
              >
                {columns[col.value].length}
              </Badge>
            </div>
            <KanbanColumnContent
              value={col.value}
              className="flex min-h-16 flex-col gap-2"
            >
              {columns[col.value].map((t) => (
                <KanbanItem key={t.id} value={t.id}>
                  <TaskCard task={t} unit={unit} />
                </KanbanItem>
              ))}
              {columns[col.value].length === 0 && (
                <Empty className="gap-0 rounded-lg border border-border p-0 py-6">
                  <EmptyHeader>
                    <EmptyDescription className="text-xs">
                      Drop a card here
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
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

function TaskCard({
  task: t,
  unit,
  overlay,
}: {
  task: Task;
  unit: string;
  overlay?: boolean;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "gap-2.5 bg-background shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        overlay && "rotate-1 shadow-lg",
      )}
    >
      <CardHeader>
        <CardTitle className="min-w-0 text-sm leading-snug font-medium">
          {t.title}
        </CardTitle>
        <CardAction>
          <KanbanItemHandle
            render={
              <button
                type="button"
                aria-label={`Drag "${t.title}"`}
                title="Drag to change state"
              />
            }
            className="-mt-0.5 -mr-1 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100 hover:bg-muted focus-visible:opacity-100"
          >
            <GripVerticalIcon className="size-4" />
          </KanbanItemHandle>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-1">
        <PTagChip tag={pTag(t)} />
        <CategoryBadge category={t.category} />
        <SeverityBadge severity={t.severity} />
      </CardContent>
      <Separator />
      <CardFooter className="justify-between gap-2 border-t-0 bg-transparent pt-0 text-xs text-muted-foreground">
        <span className="truncate">
          {t.level == null ? "–" : `${t.levelName ?? unit} · ${t.level}`}
        </span>
        {t.playersLost != null && t.playersLost > 0 && (
          <span className="font-mono text-loss tabular-nums">
            −{fmt.int(t.playersLost)} players
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
