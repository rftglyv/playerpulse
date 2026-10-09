import type { Extraction, Group, Message } from "./types";

/**
 * Group extractions into candidate issues.
 * - technical bugs: (level, mechanic)
 * - difficulty claims: (level) — "too hard" complaints about one level are one argument
 * Level-less reports attach to the single existing group with the same mechanic, if unambiguous.
 */
export function groupExtractions(extractions: Extraction[], messages: Message[]): Group[] {
  const author = new Map(messages.map((m) => [m.id, m.author]));
  const groups = new Map<string, Group>();
  const keyOf = (e: Extraction, level: number | null) =>
    e.report_type === "difficulty_claim" ? `difficulty:${level}` : `bug:${level}:${e.mechanic ?? "other"}`;

  const add = (e: Extraction, level: number | null) => {
    const key = keyOf(e, level);
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        level,
        mechanic: e.report_type === "difficulty_claim" ? "difficulty" : (e.mechanic ?? "other"),
        kind: e.report_type as Group["kind"],
        message_ids: [],
        authors: new Set(),
      };
      groups.set(key, g);
    }
    g.message_ids.push(e.id);
    g.authors.add(author.get(e.id) ?? e.id);
  };

  const reports = extractions.filter((e) => e.report_type !== "noise" && !e.extraction_failed);
  for (const e of reports.filter((e) => e.level !== null)) add(e, e.level);

  for (const e of reports.filter((e) => e.level === null)) {
    if (e.report_type !== "technical_bug" || !e.mechanic) continue; // stays unattached
    const candidates = [...groups.values()].filter((g) => g.kind === "technical_bug" && g.mechanic === e.mechanic);
    if (candidates.length === 1) {
      candidates[0].message_ids.push(e.id);
      candidates[0].authors.add(author.get(e.id) ?? e.id);
    }
  }
  return [...groups.values()];
}
