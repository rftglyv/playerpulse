import { Suspense } from "react";
import { headers } from "next/headers";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/login-form";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

async function getUser(): Promise<{ id: string } | null> {
  const cookie = (await headers()).get("cookie") ?? "";
  if (!cookie) return null;
  try {
    const res = await fetch(`${API_URL}/api/me`, { headers: { cookie }, cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { user: { id: string } | null };
    return body.user ?? null;
  } catch {
    return null;
  }
}

/** Server-side session check: signed out renders the login card in place (URL unchanged), signed in renders children. */
export async function AuthGate({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) {
    return (
      <AuthShell>
        <Suspense fallback={<div className="h-80 rounded-xl border bg-card" />}>
          <LoginForm />
        </Suspense>
      </AuthShell>
    );
  }
  return <>{children}</>;
}

export function GateSkeleton() {
  return (
    <div className="flex min-h-svh">
      <Skeleton className="hidden w-64 rounded-none md:block" />
      <div className="flex-1 space-y-4 p-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
