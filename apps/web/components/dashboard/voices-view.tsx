"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Gamepad2Icon,
  MessageSquareIcon,
  StarIcon,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RunMessage, RunResult } from "@/lib/api";
import { langLabel } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, CategoryBadge } from "./issues-view";

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

export function ChannelIcon({
  channel,
  className,
}: {
  channel: string;
  className?: string;
}) {
  const Icon = CHANNEL_ICON[channel] ?? MessageSquareIcon;
  return (
    <Icon
      className={cn("shrink-0", className)}
      aria-label={CHANNEL_LABEL[channel] ?? channel}
    />
  );
}

const FILTERS = ["all", "bug", "balance", "skill_issue", "noise"] as const;

function Voice({ m, result }: { m: RunMessage; result: RunResult }) {
  const translated = m.english_translation && m.english_translation !== m.text;
  return (
    <Item size="sm" className="items-start px-0">
      <ItemMedia className="mt-1 text-muted-foreground">
        <ChannelIcon channel={m.channel} className="size-4" />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="line-clamp-none w-auto text-[15px] leading-relaxed font-normal">
          “{m.text}”
        </ItemTitle>
        {translated && (
          <ItemDescription className="line-clamp-none leading-relaxed">
            {m.english_translation}
          </ItemDescription>
        )}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <span>{CHANNEL_LABEL[m.channel] ?? m.channel}</span>
          {m.level != null && (
            <span>
              ·{" "}
              {result.levels?.[String(m.level)] ?? `${result.unit} ${m.level}`}
            </span>
          )}
          {m.timestamp && (
            <span className="font-mono">· {m.timestamp.replace("T", " ")}</span>
          )}
          <span className="font-mono">· {m.id}</span>
        </div>
      </ItemContent>
      <ItemActions className="flex-wrap justify-end">
        <Badge variant="outline" className="border-dashed">
          {langLabel(m.language)}
        </Badge>
        <CategoryBadge category={m.category} />
        {m.sarcastic && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge
                  variant="outline"
                  className="border-watch/30 text-watch"
                />
              }
            >
              sarcasm
            </TooltipTrigger>
            <TooltipContent>Model flagged this as sarcastic</TooltipContent>
          </Tooltip>
        )}
      </ItemActions>
    </Item>
  );
}

function VoiceList({
  items,
  result,
}: {
  items: RunMessage[];
  result: RunResult;
}) {
  return (
    <>
      {items.map((m, i) => (
        <Fragment key={m.id}>
          {i > 0 && <ItemSeparator />}
          <Voice m={m} result={result} />
        </Fragment>
      ))}
    </>
  );
}

export function VoicesView({ result }: { result: RunResult }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [open, setOpen] = useState<string | null>(null);

  const msgs =
    filter === "all"
      ? result.messages
      : result.messages.filter((m) => m.category === filter);
  const count = (f: string) =>
    f === "all"
      ? result.messages.length
      : result.messages.filter((m) => m.category === f).length;

  const clusters = useMemo(() => {
    const map = new Map<string, RunMessage[]>();
    for (const m of msgs) {
      const k = m.mechanic || "unclustered";
      map.set(k, [...(map.get(k) ?? []), m]);
    }
    return [...map.entries()]
      .map(([mechanic, items]) => ({ mechanic, items }))
      .sort((a, b) =>
        a.mechanic === "unclustered"
          ? 1
          : b.mechanic === "unclustered"
            ? -1
            : b.items.length - a.items.length,
      );
  }, [msgs]);

  return (
    <div className="space-y-5">
      <ToggleGroup
        variant="outline"
        size="sm"
        className="flex-wrap"
        value={[filter]}
        onValueChange={(v) =>
          v[0] && setFilter(v[0] as (typeof FILTERS)[number])
        }
        aria-label="Filter by category"
      >
        {FILTERS.map((f) => (
          <ToggleGroupItem key={f} value={f}>
            {f === "all" ? "All" : CATEGORY_LABEL[f]}{" "}
            <span className="font-mono tabular-nums opacity-70">
              {count(f)}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {clusters.length === 0 ? (
        <Empty className="border border-border">
          <EmptyHeader>
            <EmptyTitle>No messages in this category</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        clusters.map(({ mechanic, items }) => {
          const langs = [...new Set(items.map((m) => langLabel(m.language)))];
          const channels = [...new Set(items.map((m) => m.channel))];
          const expanded = open === mechanic;
          return (
            <Card key={mechanic} data-card>
              <Collapsible
                open={expanded}
                onOpenChange={(o) => setOpen(o ? mechanic : null)}
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold tracking-tight capitalize">
                    {mechanic === "unclustered"
                      ? "No specific mechanic"
                      : mechanic}
                  </CardTitle>
                  <CardAction className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {channels.map((c) => (
                        <ChannelIcon key={c} channel={c} className="size-3.5" />
                      ))}
                    </span>
                    <span>{langs.join(" · ")}</span>
                    <span className="font-mono text-base text-foreground tabular-nums">
                      {items.length}
                    </span>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <ItemGroup>
                    <VoiceList items={items.slice(0, 3)} result={result} />
                  </ItemGroup>
                  {items.length > 3 && (
                    <>
                      <CollapsibleContent>
                        <ItemGroup>
                          <ItemSeparator />
                          <VoiceList items={items.slice(3)} result={result} />
                        </ItemGroup>
                      </CollapsibleContent>
                      <CollapsibleTrigger
                        render={
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-2 h-auto px-0 text-xs text-watch"
                          />
                        }
                      >
                        {expanded
                          ? "Show fewer"
                          : `Show all ${items.length} messages`}
                      </CollapsibleTrigger>
                    </>
                  )}
                </CardContent>
              </Collapsible>
            </Card>
          );
        })
      )}
    </div>
  );
}
