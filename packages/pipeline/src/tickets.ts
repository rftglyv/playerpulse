import { z } from "zod";
import { llmJson, type LlmMeter } from "./llm";
import { PROMPT_VERSION, ticketSystem } from "./prompts";
import type { Extraction, GameInfo, Issue, Message, Ticket } from "./types";

const TicketOut = z.object({
  title: z.string(),
  summary: z.string(),
  suspected_cause: z.string(),
  repro_steps: z.array(z.string()),
  severity: z.enum(["blocker", "major", "minor", "cosmetic"]),
  evidence_ids: z.array(z.string()),
});

export async function writeTicket(
  issue: Issue,
  game: GameInfo,
  messages: Map<string, Message>,
  extractions: Map<string, Extraction>,
  model: string,
  meter: LlmMeter,
): Promise<Ticket> {
  const ids = issue.message_ids.slice(0, 25);
  const user = [
    `${game.unit} ${issue.level ?? "unknown"}${issue.level_name ? ` (${issue.level_name})` : ""}, mechanic: ${issue.mechanic}, type: ${issue.category}`,
    `Telemetry: ${issue.telemetry_evidence}. Players lost estimate: ${issue.players_lost_estimate}.`,
    `Distinct players reporting: ${issue.distinct_players}.`,
    "Player messages:",
    ...ids.map((id) => JSON.stringify({ id, text: messages.get(id)?.text, english: extractions.get(id)?.english_translation })),
  ].join("\n");

  const out = await llmJson({
    model,
    promptVersion: "ticket_v1:" + PROMPT_VERSION,
    system: ticketSystem(game),
    user,
    meter,
    parse: (raw) => TicketOut.parse(raw),
  });
  const evidenceIds = out.evidence_ids.filter((id) => issue.message_ids.includes(id));
  const chosen = (evidenceIds.length ? evidenceIds : ids).slice(0, 5);
  return {
    title: out.title,
    summary: out.summary,
    suspected_cause: out.suspected_cause,
    repro_steps: out.repro_steps.map((s) => s.trim()).filter(Boolean),
    severity: out.severity,
    evidence: chosen.map((id) => ({
      id,
      text: messages.get(id)?.text ?? "",
      english: extractions.get(id)?.english_translation ?? "",
    })),
  };
}
