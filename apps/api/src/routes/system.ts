import { db } from "@playerpulse/db";
import { DEFAULT_MODEL, MODELS } from "@playerpulse/pipeline";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { demoReadonly } from "../limits";

export const systemRoutes = new Elysia({ tags: ["system"] })
  .get("/health", async () => {
    await db.execute(sql`select 1`);
    return { ok: true };
  })
  .get("/models", () => ({ default: DEFAULT_MODEL, models: MODELS, live: !!process.env.OPENROUTER_API_KEY && !demoReadonly() }));
