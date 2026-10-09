"use client";

import { BrandMark } from "@/components/brand-mark";
import * as React from "react";
import Link from "next/link";
import { Iconizer } from "@/components/iconizer";
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
  status,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  /** run status card shown above the user menu */
  status?: React.ReactNode;
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
                <BrandMark height={22} />
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
              icon: <Iconizer icon={s.icon} size={18} />,
              isActive: section === s.id,
              badge: counts[s.id],
            }))}
          />
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-3 pb-3">
        {status}
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
