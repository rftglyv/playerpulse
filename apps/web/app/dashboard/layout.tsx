import { Suspense } from "react";
import { AuthGate, GateSkeleton } from "@/components/auth/auth-gate";

// Auth gate for every /dashboard route. The session check reads request cookies, so it sits inside
// Suspense (cacheComponents); signed-out visitors get the login card at the same URL.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<GateSkeleton />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}
