import { z } from "zod";
import { llmJson, type LlmMeter } from "./llm";
import { extractSystem, extractUser, MECHANICS, PROMPT_VERSION } from "./prompts";
import type { Extraction, GameInfo, Message } from "./types";

const Item = z.object({
  id: z.string(),
  level: z.union([z.number(), z.string(), z.null()]).optional(),
  level_evidence: z.string().nullable().optional(),
  mechanic: z.string().nullable().optional(),
  symptom: z.string().nullable().optional(),
  report_type: z.enum(["technical_bug", "difficulty_claim", "noise"]),
  sarcastic: z.boolean().optional(),
  language: z.string().optional(),
  english_translation: z.string().optional(),
  confidence: z.number().optional(),
});
const Batch = z.object({ results: z.array(Item) });

export const BATCH_SIZE = 20;

export async function extractAll(
  messages: Message[],
  game: GameInfo,
  model: string,
  meter: LlmMeter,
): Promise<Extraction[]> {
  const levelCount = Object.keys(game.levels).length;
  const batches: Message[][] = [];
  for (let i = 0; i < messages.length; i += BATCH_SIZE) batches.push(messages.slice(i, i + BATCH_SIZE));

  const results = await Promise.all(
    batches.map(async (batch) => {
      try {
        const out = await llmJson({
          model,
          promptVersion: PROMPT_VERSION,
          system: extractSystem(game),
          user: extractUser(batch),
          meter,
          parse: (raw) => Batch.parse(raw),
        });
        const byId = new Map(out.results.map((r) => [r.id, r]));
        return batch.map((m) => normalise(m, byId.get(m.id), levelCount));
      } catch (err) {
        console.error(`extraction batch failed (${batch[0].id}…): ${err}`);
        return batch.map((m) => normalise(m, undefined, levelCount));
      }
    }),
  );
  return results.flat();
}

function normalise(m: Message, r: z.infer<typeof Item> | undefined, levelCount: number): Extraction {
  if (!r) {
    return {
      id: m.id, level: null, level_evidence: null, mechanic: null, symptom: null,
      report_type: "noise", sarcastic: false, language: "unknown", english_translation: m.text,
      confidence: 0, extraction_failed: true,
    };
  }
  const lvl = r.level === null || r.level === undefined ? null : Number(r.level);
  // A level that doesn't exist ("level 47") is treated as unknown.
  const level = lvl !== null && Number.isInteger(lvl) && lvl >= 1 && lvl <= levelCount ? lvl : null;
  const mech = (r.mechanic ?? "").toLowerCase().trim();
  const mechanic = r.report_type === "noise" ? null : (MECHANICS as readonly string[]).includes(mech) ? mech : mech ? "other" : null;
  return {
    id: m.id,
    level,
    level_evidence: r.level_evidence ?? null,
    mechanic,
    symptom: r.symptom ?? null,
    report_type: r.report_type,
    sarcastic: !!r.sarcastic,
    language: r.language ?? "unknown",
    english_translation: r.english_translation ?? m.text,
    confidence: Math.max(0, Math.min(1, r.confidence ?? 0.5)),
  };
}
