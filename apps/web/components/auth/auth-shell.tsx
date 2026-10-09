import Link from "next/link";
import { AuthBackdrop } from "./auth-backdrop";

/** Full-page login-01 frame: brand above a centered max-w-sm card. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate flex min-h-svh w-full flex-1 items-center justify-center bg-muted/40 p-6 md:p-10">
      <AuthBackdrop />
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="block text-center font-serif text-xl font-semibold tracking-tight">
          PlayerPulse
        </Link>
        {children}
      </div>
    </main>
  );
}
