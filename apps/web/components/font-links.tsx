/**
 * Material Symbols allow-list. The Google Fonts request is subset with
 * `icon_names=` so only these glyphs download. Any icon used through
 * <Iconizer> MUST be listed here, otherwise it renders as its ligature text.
 */
const ICONS = [
  // dashboard sidebar
  "dashboard",
  "compare_arrows",
  "bug_report",
  "balance",
  "checklist",
  "forum",
  "visibility",
  // chrome / actions
  "add",
  "content_copy",
  "check",
  "grid_view",
  "view_list",
  "view_kanban",
  "search",
  "search_off",
  "chevron_left",
  "chevron_right",
  "arrow_back",
  "arrow_forward",
  "arrow_downward",
  "drag_indicator",
  "more_vert",
  "logout",
  "person",
  "inbox",
  "gavel",
  "error",
  "warning",
  "expand_more",
  // statuses
  "check_circle",
  "hourglass_top",
  "schedule",
  // channels
  "chat",
  "star",
  "sports_esports",
  // landing
  "hearing",
  "query_stats",
  "task_alt",
  "menu_book",
  "science",
  "payments",
  "mail",
  "lock",
] as const;

const icons = Array.from(new Set<string>(ICONS)).sort();

/** Every Material Symbol requested from Google Fonts (dev warnings only). */
export const KNOWN_ICON_NAMES: ReadonlySet<string> = new Set(icons);

const BASE_URL =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";

export function FontLinks() {
  const href = `${BASE_URL}&icon_names=${icons.join(",")}&display=block`;
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={href} />
    </>
  );
}
