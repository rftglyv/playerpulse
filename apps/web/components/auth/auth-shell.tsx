import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="flex min-h-svh flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="block text-center font-serif text-lg font-medium tracking-[-0.02em]">
          PlayerPulse
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-[24px] leading-tight font-medium tracking-[-0.02em]">{title}</CardTitle>
            <CardDescription className="font-mono text-[11.5px]">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {children}
            <p className="text-center text-sm text-muted-foreground">{footer}</p>
          </CardContent>
        </Card>
        <Link
          href="/dashboard/overview"
          className="flex items-center justify-center gap-1.5 font-mono text-[11.5px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" /> Browse the demo without an account
        </Link>
      </div>
    </main>
  );
}
