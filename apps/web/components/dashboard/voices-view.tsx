"use client";

import { useMemo, useState } from "react";
import { Gamepad2Icon, MessageSquareIcon, StarIcon, type LucideIcon } from "lucide-react";
import type { RunMessage, RunResult } from "@/lib/api";
import { langLabel } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, CategoryBadge } from "./issues-view";
import { EmptyState } from "./states";

export const CHANNEL_LABEL: Record<string, string> = {
  discord: "Discord",
  steam_review: "Steam reviews",
  in_game: "In-game reports",
};

const CHANNEL_ICON: Record<string, LucideIcon> = {
  discord: MessageSquareIcon,
  steam_review: StarIcon,
  in_game: Gamepad2Icon,
};

export function ChannelIcon({ channel, className }: { channel: string; className?: string }) {
  const Icon = CHANNEL_ICON[channel] ?? MessageSquareIcon;
  return <Icon className={cn("shrink-0", className)} aria-label={CHANNEL_LABEL[channel] ?? channel} />;
}

const FILTERS = ["all", "bug", "balance", "skill_issue", "noise"] as const;

function Voice({ m, result }: { m: RunMessage; result: RunResult }) {
  const translated = m.english_translation && m.english_translation !== m.text;
  return (
    <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 border-b border-border py-3 last:border-b-0">
      <ChannelIcon channel={m.channel} className="mt-1 size-4 text-muted-foreground" />
      <div className="min-w-0 space-y-1.5">
        <p className="text-[15px] leading-relaxed">“{m.text}”</p>
        {translated && <p className="text-sm leading-relaxed text-muted-foreground">{m.english_translation}</p>}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="rounded-[5px] border border-dashed border-border px-1.5 py-0.5">{langLabel(m.language)}</span>
          <CategoryBadge category={m.category} />
          {m.sarcastic && (
            <span className="rounded-[5px] bg-watch/10 px-1.5 py-0.5 text-watch" title="Model flagged this as sarcastic">
              sarcasm
            </span>
          )}
          <span>{CHANNEL_LABEL[m.channel] ?? m.channel}</span>
          {m.level != null && <span>· {result.levels?.[String(m.level)] ?? `${result.unit} ${m.level}`}</span>}
          {m.timestamp && <span>· {m.timestamp.replace("T", " ")}</span>}
          <span>· {m.id}</span>
        </div>
      </div>
    </li>
  );
}

export function VoicesView({ result }: { result: RunResult }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [open, setOpen] = useState<string | null>(null);

  const msgs = filter === "all" ? result.messages : result.messages.filter((m) => m.category === filter);
  const count = (f: string) => (f === "all" ? result.messages.length : result.messages.filter((m) => m.category === f).length);

  const clusters = useMemo(() => {
    const map = new Map<string, RunMessage[]>();
    for (const m of msgs) {
      const k = m.mechanic || "unclustered";
      map.set(k, [...(map.get(k) ?? []), m]);
    }
    return [...map.entries()]
      .map(([mechanic, items]) => ({ mechanic, items }))
      .sort((a, b) => (a.mechanic === "unclustered" ? 1 : b.mechanic === "unclustered" ? -1 : b.items.length - a.items.length));
  }, [msgs]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm transition-colors",
              filter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "all" ? "All" : CATEGORY_LABEL[f]} <span className="tabular-nums opacity-70">{count(f)}</span>
          </button>
        ))}
      </div>
      {clusters.length === 0 ? (
        <EmptyState title="No messages in this category" />
      ) : (
        clusters.map(({ mechanic, items }) => {
          const langs = [...new Set(items.map((m) => langLabel(m.language)))];
          const channels = [...new Set(items.map((m) => m.channel))];
          const expanded = open === mechanic;
          const shown = expanded ? items : items.slice(0, 3);
          return (
            <section key={mechanic} data-card className="rounded-[10px] border border-border bg-card px-6 py-5">
              <header className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-tight capitalize">
                  {mechanic === "unclustered" ? "No specific mechanic" : mechanic}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {channels.map((c) => (
                      <ChannelIcon key={c} channel={c} className="size-3.5" />
                    ))}
                  </span>
                  <span>{langs.join(" · ")}</span>
                  <span className="font-mono text-base text-foreground tabular-nums">{items.length}</span>
                </div>
              </header>
              <ul>
                {shown.map((m) => (
                  <Voice key={m.id} m={m} result={result} />
                ))}
              </ul>
              {items.length > 3 && (
                <button
                  onClick={() => setOpen(expanded ? null : mechanic)}
                  className="mt-2 text-xs text-watch hover:underline"
                >
                  {expanded ? "Show fewer" : `Show all ${items.length} messages`}
                </button>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
