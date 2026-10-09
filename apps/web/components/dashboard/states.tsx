"use client";

import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-[10px] border border-dashed border-border px-6 py-10">
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      {body && <p className="max-w-prose text-sm text-muted-foreground">{body}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-destructive/10 px-6 py-6 text-sm">
      <div className="flex items-center gap-2 font-medium text-destructive">
        <AlertTriangleIcon className="size-4" /> Something went wrong
      </div>
      <p className="max-w-prose text-foreground/80">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-64 w-full rounded-xl" />
      ))}
    </div>
  );
}
