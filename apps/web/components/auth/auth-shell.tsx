import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { AuthBackdrop } from "./auth-backdrop";

/** Full-page login-01 frame: brand above a centered max-w-sm card. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate flex min-h-svh w-full flex-1 items-center justify-center bg-muted/40 p-6 md:p-10">
      <AuthBackdrop />
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex items-center justify-center gap-[0.35em] font-serif text-xl leading-none font-semibold tracking-tight">
          <BrandMark />
          PlayerPulse
        </Link>
        {children}
      </div>
    </main>
  );
}
