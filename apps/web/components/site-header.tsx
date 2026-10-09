import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-[rgba(255,255,255,0.72)] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_-20px_rgba(0,0,0,0.18)] backdrop-blur-xl backdrop-saturate-[1.4] sm:px-6 lg:gap-3">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 h-4 data-vertical:self-auto" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-serif text-[22px] leading-tight font-medium tracking-[-0.02em]">{title}</h1>
        {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </header>
  );
}
