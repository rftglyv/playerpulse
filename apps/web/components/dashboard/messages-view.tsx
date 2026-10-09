"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RunMessage, RunResult } from "@/lib/api";
import { langLabel } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, CategoryBadge } from "./issues-view";
import { EmptyState } from "./states";

function MessagesTable({ messages, showReason }: { messages: RunMessage[]; showReason?: boolean }) {
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
              <TableCell className="font-mono text-xs text-muted-foreground">{m.id}</TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <CategoryBadge category={m.category} />
                  {m.sarcastic && <span className="text-[11px] text-watch">sarcastic</span>}
                </div>
              </TableCell>
              <TableCell className="text-xs">{langLabel(m.language)}</TableCell>
              <TableCell className="max-w-sm whitespace-normal">{m.text}</TableCell>
              <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
                {m.english_translation && m.english_translation !== m.text ? m.english_translation : "–"}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  showReason && m.confidence < 0.6 && "text-watch",
                )}
              >
                {Math.round(m.confidence * 100)}%
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
        Low-confidence or ambiguous messages the model wasn&apos;t sure about. A person should read these before
        they&apos;re trusted.
      </p>
      {msgs.length === 0 ? (
        <EmptyState title="Nothing needs a human look" body="Every message in this run was classified confidently." />
      ) : (
        <MessagesTable messages={msgs} showReason />
      )}
    </div>
  );
}

const FILTERS = ["all", "bug", "balance", "skill_issue", "noise"] as const;

export function MessagesView({ result }: { result: RunResult }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const msgs = filter === "all" ? result.messages : result.messages.filter((m) => m.category === filter);
  const count = (f: string) => (f === "all" ? result.messages.length : result.messages.filter((m) => m.category === f).length);
  return (
    <div className="space-y-4">
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
      {msgs.length === 0 ? <EmptyState title="No messages in this category" /> : <MessagesTable messages={msgs} />}
    </div>
  );
}
