"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/** Link to the other auth page, carrying ?next= through. */
export function AuthSwitchLink({ href, children }: { href: "/login" | "/signup"; children: React.ReactNode }) {
  const next = useSearchParams().get("next");
  return (
    <Link href={next ? `${href}?next=${encodeURIComponent(next)}` : href} className="font-medium text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
