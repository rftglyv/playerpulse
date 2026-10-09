import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Sign in · PlayerPulse" };

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-80 rounded-xl border bg-card" />}>
        <LoginForm redirect />
      </Suspense>
    </AuthShell>
  );
}
