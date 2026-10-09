export const SECTION_IDS = ["overview", "patch-compare", "issues", "dismissed", "tasks", "voices", "review"] as const;
export type Section = (typeof SECTION_IDS)[number];

export function isSection(v: string): v is Section {
  return (SECTION_IDS as readonly string[]).includes(v);
}

export interface SectionDef {
  id: Section;
  label: string;
  /** Material Symbols name rendered via <Iconizer>. */
  icon: string;
  blurb: string;
  group: "Insights" | "Triage" | "Players";
}

export const SECTIONS: SectionDef[] = [
  { id: "overview", label: "Overview", icon: "dashboard", blurb: "The whole patch at a glance.", group: "Insights" },
  {
    id: "patch-compare",
    label: "Patch compare",
    icon: "compare_arrows",
    blurb: "Every level, previous patch against current, next to what players said.",
    group: "Insights",
  },
  { id: "issues", label: "Issues", icon: "bug_report", blurb: "Verified problems, ranked by players lost.", group: "Triage" },
  {
    id: "dismissed",
    label: "Dismissed with proof",
    icon: "balance",
    blurb: "Complaints the telemetry settled, plus what we're keeping an eye on.",
    group: "Triage",
  },
  { id: "tasks", label: "Tasks", icon: "checklist", blurb: "Work items created from verified issues.", group: "Triage" },
  {
    id: "voices",
    label: "Player voices",
    icon: "forum",
    blurb: "Every player message, clustered by the mechanic it's about.",
    group: "Players",
  },
  {
    id: "review",
    label: "Needs a human look",
    icon: "visibility",
    blurb: "Messages the model wasn't confident about.",
    group: "Players",
  },
];

export const SECTION_GROUPS = ["Insights", "Triage", "Players"] as const;

export function sectionHref(section: Section, runId?: string | null) {
  return `/dashboard/${section}${runId ? `?run=${encodeURIComponent(runId)}` : ""}`;
}

/** Detail page for an issue; `n` is the 1-based index into run.result.issues. */
export function issueHref(n: number, runId?: string | null) {
  return `/dashboard/issues/${n}${runId ? `?run=${encodeURIComponent(runId)}` : ""}`;
}
