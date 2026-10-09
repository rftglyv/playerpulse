import { IdParam, RunCreate } from "@playerpulse/api-schemas";
import { db, runs } from "@playerpulse/db";
import { DEFAULT_MODEL, MODELS } from "@playerpulse/pipeline";
import { and, desc, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { authPlugin } from "../auth";
import { acquireRun, clientIp, demoReadonly } from "../limits";
import { buildScenario, InputError, runPipeline, saveRun } from "../service";

export const runRoutes = new Elysia({ prefix: "/runs", tags: ["runs"] })
  .use(authPlugin)
  // Every run belongs to the user who created it; users only ever see their own.
  .get(
    "/",
    ({ user }) =>
      db
        .select({
          id: runs.id, name: runs.name, scenario: runs.scenario, game: runs.game, model: runs.model,
          telemetry: runs.telemetry, status: runs.status, costUsd: runs.costUsd, seconds: runs.seconds,
          messagesProcessed: runs.messagesProcessed, createdAt: runs.createdAt,
        })
        .from(runs)
        .where(eq(runs.createdBy, user.id))
        .orderBy(desc(runs.createdAt)),
    { auth: true },
  )
  .get(
    "/:id",
    async ({ params, status, user }) => {
      const [run] = await db.select().from(runs).where(and(eq(runs.id, params.id), eq(runs.createdBy, user.id)));
      return run ?? status(404, { error: "run not found" });
    },
    { auth: true, params: IdParam },
  )
  .post(
    "/",
    async ({ body, status, user, request, server, set }) => {
      if (demoReadonly()) return status(403, { error: "live runs are disabled on this demo" });
      if (!process.env.OPENROUTER_API_KEY) {
        return status(503, { error: "live runs are disabled: no OPENROUTER_API_KEY; demo results are loaded" });
      }
      const model = body.model ?? DEFAULT_MODEL;
      if (!MODELS.some((m) => m.id === model)) return status(422, { error: `unknown model ${model}` });
      let scenario;
      try {
        scenario = buildScenario(body);
      } catch (err) {
        if (err instanceof InputError) return status(422, { error: err.message });
        throw err;
      }
      const slot = acquireRun(clientIp(request, server));
      if ("denied" in slot) {
        set.headers["retry-after"] = String(slot.denied.retry_after_s);
        return status(429, slot.denied);
      }
      try {
        const result = await runPipeline(scenario, { model });
        const id = await saveRun(
          result,
          body.name ?? `${scenario.name} · ${body.telemetry ? "telemetry" : "community-only"} · ${model}`,
          user.id,
        );
        return { id, meta: result.meta };
      } finally {
        slot.release();
      }
    },
    { auth: true, body: RunCreate },
  );
