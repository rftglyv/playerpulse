import { extractAll } from "./extract";
import { groupExtractions } from "./group";
import { DEFAULT_MODEL, LlmMeter } from "./llm";
import { PROMPT_VERSION } from "./prompts";
import { writeTicket } from "./tickets";
import type { Extraction, Issue, MessageCategory, RunMeta, Scenario } from "./types";
import { levelDelta, playersLost, verifyGroup } from "./verify";

export interface RunResult {
  system: string;
  scenario: string;
  game: string;
  unit: string;
  model: string;
  prompt_version: string;
  telemetry: boolean;
  messages: {
    id: string;
    category: MessageCategory;
    level: number | null;
    mechanic: string | null;
    symptom: string | null;
    confidence: number;
    language: string;
    sarcastic: boolean;
    english_translation: string;
    text: string;
    channel: string;
    needs_review: boolean;
  }[];
  issues: Issue[];
  meta: RunMeta;
}

export const LOW_CONFIDENCE = 0.6;

export async function runPipeline(
  scenario: Scenario,
  opts: { model?: string; tickets?: boolean } = {},
): Promise<RunResult> {
  const t0 = performance.now();
  const model = opts.model ?? DEFAULT_MODEL;
  const meter = new LlmMeter();
  const { game, messages, telemetry } = scenario;
  const telemetryMode = telemetry !== null;

  const extractions = await extractAll(messages, game, model, meter);
  const exById = new Map(extractions.map((e) => [e.id, e]));
  const msgById = new Map(messages.map((m) => [m.id, m]));
  const groups = groupExtractions(extractions, messages);
  const patchTime = Date.parse(game.patch_date);

  const issues: Issue[] = groups.map((g) => {
    const d = levelDelta(telemetry, g.level, game.previous_patch, game.current_patch);
    const v = verifyGroup(g, d, telemetryMode);
    const times = g.message_ids.map((id) => Date.parse(msgById.get(id)?.timestamp ?? "")).filter((t) => !Number.isNaN(t)).sort();
    const levelName = g.level !== null ? (game.levels[String(g.level)] ?? null) : null;
    const where = g.level !== null ? `${levelName} (${game.unit} ${g.level})` : `unknown ${game.unit}`;
    return {
      title: g.kind === "difficulty_claim" ? `"${where} is too hard" complaints` : `${cap(g.mechanic)} problem on ${where}`,
      category: v.category,
      level: g.level,
      level_name: levelName,
      mechanic: g.mechanic,
      status: v.status,
      message_ids: g.message_ids,
      distinct_players: g.authors.size,
      languages: [...new Set(g.message_ids.map((id) => exById.get(id)?.language ?? "unknown"))],
      telemetry_evidence: v.evidence,
      players_lost_estimate: v.status === "reported" ? playersLost(d) : 0,
      error_ratio: d ? Math.round(d.r_errors * 10) / 10 : 0,
      first_report: times.length ? new Date(times[0]).toISOString() : null,
      hours_after_patch: times.length && !Number.isNaN(patchTime) ? Math.round((times[0] - patchTime) / 36e5) : null,
      telemetry: d ? { prev: d.prev, cur: d.cur } : null,
    };
  });

  // Prioritise: players lost desc, then error ratio, then report count. Zero-impact issues go last by count.
  const reported = issues
    .filter((i) => i.status === "reported")
    .sort((a, b) =>
      b.players_lost_estimate - a.players_lost_estimate ||
      b.error_ratio - a.error_ratio ||
      b.message_ids.length - a.message_ids.length,
    );
  reported.forEach((i, n) => (i.priority = n + 1));

  if (opts.tickets !== false) {
    await Promise.all(
      reported.map(async (i) => {
        try {
          i.ticket = await writeTicket(i, game, msgById, exById, model, meter);
          i.title = i.ticket.title;
          i.repro_steps = i.ticket.repro_steps;
        } catch (err) {
          console.error(`ticket failed for ${i.title}: ${err}`);
        }
      }),
    );
  }

  const groupOf = new Map<string, Issue>();
  for (const i of issues) for (const id of i.message_ids) groupOf.set(id, i);

  const out: RunResult = {
    system: `PlayerPulse ${PROMPT_VERSION} (${telemetryMode ? "with telemetry" : "community-only"})`,
    scenario: scenario.name,
    game: game.game,
    unit: game.unit,
    model,
    prompt_version: PROMPT_VERSION,
    telemetry: telemetryMode,
    messages: messages.map((m) => {
      const e = exById.get(m.id) as Extraction;
      return {
        id: m.id,
        category: messageCategory(e, groupOf.get(m.id)),
        level: e.level,
        mechanic: e.mechanic,
        symptom: e.symptom,
        confidence: e.confidence,
        language: e.language,
        sarcastic: e.sarcastic,
        english_translation: e.english_translation,
        text: m.text,
        channel: m.channel,
        needs_review: e.report_type !== "noise" && e.confidence < LOW_CONFIDENCE,
      };
    }),
    issues: [...reported, ...issues.filter((i) => i.status !== "reported")],
    meta: {
      model,
      prompt_version: PROMPT_VERSION,
      telemetry: telemetryMode,
      messages_processed: messages.length,
      tokens_in: meter.tokens_in,
      tokens_out: meter.tokens_out,
      cost_usd: Math.round(meter.cost_usd * 10000) / 10000,
      seconds: Math.round((performance.now() - t0) / 100) / 10,
      llm_calls: meter.calls,
      cache_hits: meter.cache_hits,
    },
  };
  return out;
}

function messageCategory(e: Extraction, issue: Issue | undefined): MessageCategory {
  if (e.report_type === "noise") return "noise";
  if (issue?.status === "dismissed") return "skill_issue";
  if (issue?.category === "balance" && issue.status === "reported") return "balance";
  if (e.report_type === "technical_bug") return "bug";
  // unverified difficulty claims (no telemetry / no level) are complaints, not defects
  return issue?.status === "reported" ? "balance" : "skill_issue";
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
