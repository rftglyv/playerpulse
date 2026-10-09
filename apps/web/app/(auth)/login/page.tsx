import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSwitchLink } from "@/components/auth/auth-switch-link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in · PlayerPulse" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to PlayerPulse"
      description="Sign in to start runs and move tasks. Reading is open to everyone."
      footer={
        <>
          New here?{" "}
          <Suspense fallback={<span>Create an account</span>}>
            <AuthSwitchLink href="/signup">Create an account</AuthSwitchLink>
          </Suspense>
        </>
      }
    >
      <Suspense fallback={<div className="h-56" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
