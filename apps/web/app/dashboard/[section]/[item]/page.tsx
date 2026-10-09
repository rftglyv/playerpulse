import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { IssueDetailBody } from "@/components/dashboard/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

// See [section]/layout.tsx: the auth gate may render the login card in place of this segment.
export const instant = false;

type Params = Promise<{ section: string; item: string }>;
type SearchParams = Promise<{ run?: string | string[] }>;

const API_URL = process.env.API_URL ?? "http://localhost:4000";

// Tab title = the issue's title. The view itself reads run data from the dashboard context (client).
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { item } = await params;
  const fallback = { title: `Issue #${item} · PlayerPulse` };
  const run = (await searchParams).run;
  const cookie = (await headers()).get("cookie") ?? "";
  if (typeof run !== "string" || !cookie) return fallback;
  try {
    const res = await fetch(`${API_URL}/api/runs/${encodeURIComponent(run)}`, { headers: { cookie }, cache: "no-store" });
    if (!res.ok) return fallback;
    const body = (await res.json()) as { result?: { issues?: { title: string; ticket?: { title?: string } }[] } | null };
    const issue = body.result?.issues?.[Number(item) - 1];
    return issue ? { title: `${issue.ticket?.title ?? issue.title} · PlayerPulse` } : fallback;
  } catch {
    return fallback;
  }
}

// /dashboard/issues/<n>: n is the 1-based index of the issue in run.result.issues.
// Params are read inside <Suspense> (cacheComponents) so the shell renders instantly.
export default function IssueDetailPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<DetailFallback />}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: Params }) {
  const { section, item } = await params;
  const n = Number(item);
  if (section !== "issues" || !Number.isInteger(n) || n < 1) notFound();
  return <IssueDetailBody item={n} />;
}

function DetailFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
