import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSwitchLink } from "@/components/auth/auth-switch-link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create account · PlayerPulse" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your PlayerPulse account"
      description="An account lets you start analysis runs and update tasks."
      footer={
        <>
          Already have an account?{" "}
          <Suspense fallback={<span>Sign in</span>}>
            <AuthSwitchLink href="/login">Sign in</AuthSwitchLink>
          </Suspense>
        </>
      }
    >
      <Suspense fallback={<div className="h-96" />}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
