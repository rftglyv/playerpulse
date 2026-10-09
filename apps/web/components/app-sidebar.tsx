"use client";

import * as React from "react";
import Link from "next/link";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { SECTION_GROUPS, SECTIONS, sectionHref, type Section } from "@/components/dashboard/sections";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({
  section,
  runId,
  counts,
  game,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  section: Section;
  runId: string | null;
  counts: Partial<Record<Section, number>>;
  game?: string | null;
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="PlayerPulse" render={<Link href="/" />}>
              <span className="flex size-8 shrink-0 items-center justify-center">
                <span className="size-2 rounded-full bg-watch shadow-[0_0_0_3px_#DBEAFE]" />
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-serif text-[19px] font-semibold tracking-[-0.01em]">PlayerPulse</span>
                <span className="truncate text-xs text-muted-foreground">{game ?? "No run selected"}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {SECTION_GROUPS.map((g) => (
          <NavMain
            key={g}
            label={g}
            items={SECTIONS.filter((s) => s.group === g).map((s) => ({
              title: s.label,
              url: sectionHref(s.id, runId),
              icon: <s.icon />,
              isActive: section === s.id,
              badge: counts[s.id],
            }))}
          />
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-3 pb-3">
        <p className="px-2 text-xs leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
          Telemetry knows where. Players know why.
        </p>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
