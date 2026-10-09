import Link from "next/link";

/** Full-page login-01 frame: brand above a centered max-w-sm card. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh w-full flex-1 items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="block text-center font-serif text-lg font-medium tracking-[-0.02em]">
          PlayerPulse
        </Link>
        {children}
      </div>
    </main>
  );
}
