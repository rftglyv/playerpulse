import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SectionBody } from "@/components/dashboard/dashboard";
import { SECTION_IDS, isSection } from "@/components/dashboard/sections";
import { Skeleton } from "@/components/ui/skeleton";

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }));
}

// See [section]/layout.tsx: the auth gate may render the login card in place of this segment.
export const instant = false;

type Params = Promise<{ section: string }>;

// The shell renders instantly; reading the URL param happens inside <Suspense>
// so navigation between sections is never blocked on route data.
export default function DashboardSectionPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<SectionFallback />}>
      <Section params={params} />
    </Suspense>
  );
}

async function Section({ params }: { params: Params }) {
  const { section } = await params;
  if (!isSection(section)) notFound();
  return <SectionBody section={section} />;
}

function SectionFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
