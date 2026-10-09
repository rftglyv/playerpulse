import type { Group, IssueCategory, IssueStatus, LevelDelta, TelemetryRow } from "./types";

export const THRESHOLDS = {
  min_distinct_players: 2,
  d_completion: 0.05,
  r_errors: 5,
  r_restarts: 1.4,
  r_deaths: 1.4,
};

export function levelDelta(
  telemetry: TelemetryRow[] | null,
  level: number | null,
  prevPatch: string,
  curPatch: string,
): LevelDelta | null {
  if (!telemetry || level === null) return null;
  const prev = telemetry.find((r) => r.patch === prevPatch && r.level === level);
  const cur = telemetry.find((r) => r.patch === curPatch && r.level === level);
  if (!prev || !cur) return null;
  return {
    prev,
    cur,
    d_completion: round(prev.completion_rate - cur.completion_rate, 4),
    r_deaths: prev.deaths_per_player > 0 ? cur.deaths_per_player / prev.deaths_per_player : 1,
    r_restarts: prev.restarts_per_player > 0 ? cur.restarts_per_player / prev.restarts_per_player : 1,
    r_errors: cur.error_reports / Math.max(prev.error_reports, 1),
  };
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const round = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

export function evidenceString(d: LevelDelta): string {
  const parts = [
    `completion ${pct(d.prev.completion_rate)} → ${pct(d.cur.completion_rate)}`,
    `deaths/player ${d.prev.deaths_per_player} → ${d.cur.deaths_per_player}${d.r_deaths < THRESHOLDS.r_deaths ? " (not a difficulty spike)" : ""}`,
    `restarts ${d.prev.restarts_per_player} → ${d.cur.restarts_per_player}`,
    `error reports ${d.prev.error_reports} → ${d.cur.error_reports}`,
  ];
  return parts.join(", ");
}

export function playersLost(d: LevelDelta | null): number {
  if (!d) return 0;
  return Math.round(d.cur.players_started * Math.max(0, d.prev.completion_rate - d.cur.completion_rate));
}

/** The product's brain. Telemetry doesn't silence bugs; it settles arguments. */
export function verifyGroup(
  g: Pick<Group, "kind" | "authors">,
  d: LevelDelta | null,
  telemetryMode: boolean,
): { status: IssueStatus; category: IssueCategory; evidence: string } {
  const evidence = d ? evidenceString(d) : telemetryMode ? "no telemetry for this level" : "community-only mode: no telemetry";

  if (g.kind === "technical_bug") {
    const signal =
      !!d && (d.d_completion >= THRESHOLDS.d_completion || d.r_errors >= THRESHOLDS.r_errors || d.r_restarts >= THRESHOLDS.r_restarts);
    if (g.authors.size >= THRESHOLDS.min_distinct_players || signal) return { status: "reported", category: "bug", evidence };
    return { status: "watch", category: "bug", evidence: `${evidence}; single report, no telemetry signal` };
  }

  if (!telemetryMode || !d) {
    return { status: "watch", category: "balance", evidence: `${evidence}; needs telemetry to verify` };
  }
  if (d.r_deaths >= THRESHOLDS.r_deaths || d.d_completion >= THRESHOLDS.d_completion) {
    return { status: "reported", category: "balance", evidence };
  }
  return { status: "dismissed", category: "skill_issue", evidence: `${evidence}: nothing changed since the patch` };
}
