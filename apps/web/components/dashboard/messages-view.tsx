"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function EmptyBlock({ title, body }: { title: string; body?: string }) {
  return (
    <Empty className="border border-border">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {body && <EmptyDescription>{body}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  );
}

function MessagesTable({
  messages,
  showReason,
}: {
  messages: RunMessage[];
  showReason?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/8">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead className="w-28">Category</TableHead>
            <TableHead className="w-14">Lang</TableHead>
            <TableHead>Original</TableHead>
            <TableHead>English</TableHead>
            <TableHead className="w-20 text-right">Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((m) => (
            <TableRow key={m.id} className="align-top">
              <TableCell className="font-mono text-xs text-muted-foreground">
                {m.id}
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <CategoryBadge category={m.category} />
                  {m.sarcastic && (
                    <Badge
                      variant="outline"
                      className="border-watch/30 text-watch"
                    >
                      sarcastic
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{langLabel(m.language)}</Badge>
              </TableCell>
              <TableCell className="max-w-sm whitespace-normal">
                {m.text}
              </TableCell>
              <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
                {m.english_translation && m.english_translation !== m.text
                  ? m.english_translation
                  : "–"}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono tabular-nums",
                  showReason && m.confidence < 0.6 && "text-watch",
                )}
              >
                {showReason ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono tabular-nums",
                            m.confidence < 0.6 && "border-watch/30 text-watch",
                          )}
                        />
                      }
                    >
                      {Math.round(m.confidence * 100)}%
                    </TooltipTrigger>
                    <TooltipContent>
                      {m.confidence < 0.6
                        ? "Below 60% confidence"
                        : "Model confidence"}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  `${Math.round(m.confidence * 100)}%`
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ReviewView({ result }: { result: RunResult }) {
  const msgs = result.messages.filter((m) => m.needs_review);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Low-confidence or ambiguous messages the model wasn&apos;t sure about. A
        person should read these before they&apos;re trusted.
      </p>
      {msgs.length === 0 ? (
        <EmptyBlock
          title="Nothing needs a human look"
          body="Every message in this run was classified confidently."
        />
      ) : (
        <MessagesTable messages={msgs} showReason />
      )}
    </div>
  );
}

const FILTERS = ["all", "bug", "balance", "skill_issue", "noise"] as const;

export function MessagesView({ result }: { result: RunResult }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const msgs =
    filter === "all"
      ? result.messages
      : result.messages.filter((m) => m.category === filter);
  const count = (f: string) =>
    f === "all"
      ? result.messages.length
      : result.messages.filter((m) => m.category === f).length;
  return (
    <div className="space-y-4">
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
      {msgs.length === 0 ? (
        <EmptyBlock title="No messages in this category" />
      ) : (
        <MessagesTable messages={msgs} />
      )}
    </div>
  );
}
