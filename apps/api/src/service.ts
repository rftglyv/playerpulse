import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { db, issues, runs, tasks } from "@playerpulse/db";
import {
  loadScenarioDir,
  parseGameInfo,
  parseMessages,
  parseTelemetry,
  runPipeline,
  type Issue,
  type RunResult,
  type Scenario,
} from "@playerpulse/pipeline";
import type { RunCreate } from "@playerpulse/api-schemas";
import { sql } from "drizzle-orm";

export const DATA_DIR = resolve(process.env.EVAL_DATA_DIR ?? join(import.meta.dir, "../../../eval/data"));
const DEMO_DIR = resolve(process.env.DEMO_DIR ?? join(import.meta.dir, "../../../demo"));
export const SCENARIOS = { A: "scenario_A", B: "scenario_B" } as const;
export const MAX_UPLOAD_MESSAGES = 1000;

/** P0 = blocker or top-2 impact, P1 = major, P2 = the rest. Priority tag the studio sorts tasks by. */
export function priorityTag(i: Issue): "P0" | "P1" | "P2" {
  const sev = i.ticket?.severity;
  if (sev === "blocker" || (i.priority !== undefined && i.priority <= 2 && i.players_lost_estimate > 0)) return "P0";
  if (sev === "major" || i.category === "balance") return "P1";
  return "P2";
}

export async function saveRun(result: RunResult, name: string) {
  return db.transaction(async (tx) => {
    const [run] = await tx
      .insert(runs)
      .values({
        name,
        scenario: result.scenario,
        game: result.game,
        model: result.model,
        promptVersion: result.prompt_version,
        telemetry: result.telemetry ? 1 : 0,
        status: "done",
        messagesProcessed: result.meta.messages_processed,
        tokensIn: result.meta.tokens_in,
        tokensOut: result.meta.tokens_out,
        costUsd: result.meta.cost_usd,
        seconds: result.meta.seconds,
        result,
      })
      .returning({ id: runs.id });
    for (const i of result.issues) {
      const [row] = await tx
        .insert(issues)
        .values({
          runId: run.id,
          priority: i.priority ?? null,
          title: i.title,
          status: i.status,
          category: i.category,
          severity: i.ticket?.severity ?? null,
          level: i.level,
          levelName: i.level_name,
          mechanic: i.mechanic,
          playersLost: i.players_lost_estimate,
          reports: i.message_ids.length,
          distinctPlayers: i.distinct_players,
          telemetryEvidence: i.telemetry_evidence,
          detail: i,
        })
        .returning({ id: issues.id });
      if (i.status === "reported") {
        await tx.insert(tasks).values({
          issueId: row.id,
          tags: [priorityTag(i), i.category, i.mechanic, ...(i.ticket?.severity ? [i.ticket.severity] : [])],
        });
      }
    }
    return run.id;
  });
}

/** Load committed demo results into an empty database so the dashboard works with no API key. */
export async function seedDemo() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(runs);
  if (n > 0 || !existsSync(DEMO_DIR)) return 0;
  const files = readdirSync(DEMO_DIR).filter((f) => f.endsWith(".json")).sort();
  for (const f of files) await saveRun(JSON.parse(readFileSync(join(DEMO_DIR, f), "utf8")), `demo: ${f.replace(".json", "")}`);
  return files.length;
}


export class InputError extends Error {}

/** Turn a run request into a scenario: a bundled test-pack scenario or an uploaded CSV set. */
export function buildScenario(body: RunCreate): Scenario {
  if (body.scenario) return loadScenarioDir(join(DATA_DIR, SCENARIOS[body.scenario]), body.telemetry);
  if (!body.upload) throw new InputError("pass scenario or upload");
  const messages = parseMessages(body.upload.messages_csv);
  if (messages.length === 0) throw new InputError("no messages found (expected columns id,timestamp,channel,author,text)");
  if (messages.length > MAX_UPLOAD_MESSAGES) throw new InputError(`max ${MAX_UPLOAD_MESSAGES} messages per run`);
  const game = parseGameInfo(body.upload.game_info_json);
  const telemetry = body.telemetry && body.upload.telemetry_csv ? parseTelemetry(body.upload.telemetry_csv) : null;
  return { name: game.scenario ?? "upload", game, messages, telemetry };
}

export { runPipeline };
