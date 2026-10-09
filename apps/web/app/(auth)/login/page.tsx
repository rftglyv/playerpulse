import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
  openGraph: { images: [{ url: "/og/og-auth.png", width: 1200, height: 630, alt: "Sign in to PlayerPulse" }] },
  twitter: { images: ["/og/og-auth.png"] },
};

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-80 rounded-xl border bg-card" />}>
        <LoginForm redirect />
      </Suspense>
    </AuthShell>
  );
}
