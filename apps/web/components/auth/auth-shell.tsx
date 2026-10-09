import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { AuthBackdrop } from "./auth-backdrop";

/** Full-page login-01 frame: brand above a centered max-w-sm card. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate flex min-h-svh w-full flex-1 items-center justify-center bg-muted/40 p-6 md:p-10">
      <AuthBackdrop />
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex items-center justify-center gap-2 font-serif text-xl font-semibold tracking-tight">
          <BrandMark size={28} />
          PlayerPulse
        </Link>
        {children}
      </div>
    </main>
  );
}
