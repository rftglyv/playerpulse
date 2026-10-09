"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownIcon, KanbanSquareIcon, ListIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, fmt, type Task, type TaskState } from "@/lib/api";
import { cn } from "@/lib/utils";
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
        tag === "P0" && "bg-loss text-background",
        tag === "P1" && "bg-watch/10 text-watch",
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
        <Board tasks={tasks} unit={unit} onMove={setState} />
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

function StateSelect({ task, onMove, className }: { task: Task; onMove: (t: Task, s: TaskState) => void; className?: string }) {
  return (
    <Select items={STATES} value={task.state} onValueChange={(v) => v && onMove(task, v as TaskState)}>
      <SelectTrigger size="sm" className={className} aria-label={`Move "${task.title}"`}>
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
  );
}

function Board({ tasks, unit, onMove }: { tasks: Task[]; unit: string; onMove: (t: Task, s: TaskState) => void }) {
  const [over, setOver] = useState<TaskState | null>(null);
  const sorted = [...tasks].sort(
    (a, b) => pTag(a).localeCompare(pTag(b)) || (b.playersLost ?? 0) - (a.playersLost ?? 0),
  );
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STATES.map((col) => {
        const items = sorted.filter((t) => t.state === col.value);
        return (
          <section
            key={col.value}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.value);
            }}
            onDragLeave={() => setOver((o) => (o === col.value ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/plain");
              const t = tasks.find((x) => x.id === id);
              if (t) onMove(t, col.value);
            }}
            className={cn(
              "flex min-h-40 flex-col gap-3 rounded-[10px] bg-muted/50 p-3 transition-colors",
              over === col.value && "bg-watch/10 ring-1 ring-watch/40",
            )}
          >
            <header className="flex items-center justify-between px-1">
              <h3 className="font-serif text-[15px] font-medium">{col.label}</h3>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{items.length}</span>
            </header>
            {items.map((t) => (
              <article
                key={t.id}
                data-card
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", t.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                className={cn(
                  "cursor-grab space-y-2.5 rounded-lg border border-border bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:cursor-grabbing",
                  (t.state === "done" || t.state === "wont_fix") && "opacity-70",
                )}
              >
                <div className="flex items-start gap-2">
                  <PTagChip tag={pTag(t)} />
                  <p className="min-w-0 flex-1 text-sm leading-snug font-medium">{t.title}</p>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span className="truncate">{t.level == null ? "–" : `${t.levelName ?? unit} · ${t.level}`}</span>
                  {t.playersLost != null && t.playersLost > 0 && (
                    <span className="text-loss tabular-nums">−{fmt.int(t.playersLost)} players</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <CategoryBadge category={t.category} />
                  <SeverityBadge severity={t.severity} />
                </div>
                <StateSelect task={t} onMove={onMove} className="h-7 w-full text-xs" />
              </article>
            ))}
            {items.length === 0 && (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center font-mono text-[11px] text-muted-foreground">
                Drop a card here
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
