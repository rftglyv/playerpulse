import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = {
  title: "Create account",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: true },
  openGraph: { images: [{ url: "/og/og-auth.png", width: 1200, height: 630, alt: "Create account to PlayerPulse" }] },
  twitter: { images: ["/og/og-auth.png"] },
};

export default function SignupPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-[30rem] rounded-xl border bg-card" />}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
