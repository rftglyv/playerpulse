import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard";
import { SECTION_IDS } from "@/components/dashboard/sections";

export const metadata: Metadata = { title: "Dashboard · PlayerPulse" };

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }));
}

// Shared client shell for every section: it stays mounted across section switches, so runs/run data
// is fetched once. The shell reads ?run= via useSearchParams, so it must sit inside Suspense (cacheComponents).
export default function DashboardSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
