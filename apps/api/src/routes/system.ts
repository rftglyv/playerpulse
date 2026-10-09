import { db } from "@playerpulse/db";
import { DEFAULT_MODEL, MODELS } from "@playerpulse/pipeline";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { demoReadonly } from "../limits";
import { auth } from "../auth";

export const systemRoutes = new Elysia({ tags: ["system"] })
  .get("/health", async () => {
    await db.execute(sql`select 1`);
    return { ok: true };
  })
  .get("/models", () => ({ default: DEFAULT_MODEL, models: MODELS, live: !!process.env.OPENROUTER_API_KEY && !demoReadonly() }))
  .get("/me", async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    const u = session?.user;
    return { user: u ? { id: u.id, name: u.name, email: u.email } : null };
  });
