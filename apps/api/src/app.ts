import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { db, issues, runs, tasks } from "@playerpulse/db";
import {
  DEFAULT_MODEL,
  MODELS,
  loadScenarioDir,
  parseGameInfo,
  parseMessages,
  parseTelemetry,
  runPipeline,
  type Issue,
  type RunResult,
  type Scenario,
} from "@playerpulse/pipeline";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod";

const DATA_DIR = resolve(process.env.EVAL_DATA_DIR ?? join(import.meta.dir, "../../../eval/data"));
const DEMO_DIR = resolve(process.env.DEMO_DIR ?? join(import.meta.dir, "../../../demo"));
const SCENARIOS = { A: "scenario_A", B: "scenario_B" } as const;
const MAX_UPLOAD_MESSAGES = 1000;

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

const RunBody = z.object({
  scenario: z.enum(["A", "B"]).optional(),
  upload: z
    .object({
      messages_csv: z.string().min(1).max(2_000_000),
      telemetry_csv: z.string().max(500_000).optional(),
      game_info_json: z.string().max(100_000),
    })
    .optional(),
  telemetry: z.boolean().default(true),
  model: z.enum(MODELS.map((m) => m.id) as [string, ...string[]]).default(DEFAULT_MODEL),
  name: z.string().max(120).optional(),
});

const TaskPatch = z.object({
  state: z.enum(["todo", "in_progress", "done", "wont_fix"]).optional(),
  assignee: z.string().max(80).nullable().optional(),
  tags: z.array(z.string().max(40)).max(12).optional(),
});

const Uuid = z.object({ id: z.uuid() });

export const app = new Elysia({ prefix: "/api" })
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return { error: "invalid request", detail: error.message };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "not found" };
    }
    console.error(error);
    set.status = 500;
    return { error: "internal error" };
  })
  .get("/health", async () => {
    await db.execute(sql`select 1`);
    return { ok: true };
  })
  .get("/models", () => ({ default: DEFAULT_MODEL, models: MODELS, live: !!process.env.OPENROUTER_API_KEY }))
  .get("/runs", () =>
    db
      .select({
        id: runs.id, name: runs.name, scenario: runs.scenario, game: runs.game, model: runs.model,
        telemetry: runs.telemetry, status: runs.status, costUsd: runs.costUsd, seconds: runs.seconds,
        messagesProcessed: runs.messagesProcessed, createdAt: runs.createdAt,
      })
      .from(runs)
      .orderBy(desc(runs.createdAt)),
  )
  .get(
    "/runs/:id",
    async ({ params, status }) => {
      const [run] = await db.select().from(runs).where(eq(runs.id, params.id));
      return run ?? status(404, { error: "run not found" });
    },
    { params: Uuid },
  )
  .post(
    "/runs",
    async ({ body, status }) => {
      if (!process.env.OPENROUTER_API_KEY) return status(503, { error: "live runs are disabled: no OPENROUTER_API_KEY; demo results are loaded" });
      let scenario: Scenario;
      if (body.scenario) {
        scenario = loadScenarioDir(join(DATA_DIR, SCENARIOS[body.scenario]), body.telemetry);
      } else if (body.upload) {
        const messages = parseMessages(body.upload.messages_csv);
        if (messages.length === 0) return status(422, { error: "no messages found (expected columns id,timestamp,channel,author,text)" });
        if (messages.length > MAX_UPLOAD_MESSAGES) return status(422, { error: `max ${MAX_UPLOAD_MESSAGES} messages per run` });
        const game = parseGameInfo(body.upload.game_info_json);
        const telemetry = body.telemetry && body.upload.telemetry_csv ? parseTelemetry(body.upload.telemetry_csv) : null;
        scenario = { name: game.scenario ?? "upload", game, messages, telemetry };
      } else {
        return status(422, { error: "pass scenario or upload" });
      }
      const result = await runPipeline(scenario, { model: body.model });
      const id = await saveRun(result, body.name ?? `${scenario.name} · ${body.telemetry ? "telemetry" : "community-only"} · ${body.model}`);
      return { id, meta: result.meta };
    },
    { body: RunBody },
  )
  .get(
    "/tasks",
    ({ query }) =>
      db
        .select({
          id: tasks.id, state: tasks.state, assignee: tasks.assignee, tags: tasks.tags, updatedAt: tasks.updatedAt,
          issueId: issues.id, runId: issues.runId, priority: issues.priority, title: issues.title, category: issues.category,
          severity: issues.severity, level: issues.level, levelName: issues.levelName, playersLost: issues.playersLost,
          reports: issues.reports,
        })
        .from(tasks)
        .innerJoin(issues, eq(tasks.issueId, issues.id))
        .where(query.runId ? eq(issues.runId, query.runId) : undefined)
        .orderBy(asc(issues.priority)),
    { query: z.object({ runId: z.uuid().optional() }) },
  )
  .patch(
    "/tasks/:id",
    async ({ params, body, status }) => {
      const [row] = await db
        .update(tasks)
        .set({ ...body, updatedAt: new Date() })
        .where(and(eq(tasks.id, params.id)))
        .returning();
      return row ?? status(404, { error: "task not found" });
    },
    { params: Uuid, body: TaskPatch },
  );

export type App = typeof app;
