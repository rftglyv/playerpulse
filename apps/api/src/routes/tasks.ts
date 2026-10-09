import { IdParam, TaskQuery, TaskUpdate } from "@playerpulse/api-schemas";
import { db, issues, tasks } from "@playerpulse/db";
import { asc, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { authPlugin } from "../auth";

export const taskRoutes = new Elysia({ prefix: "/tasks", tags: ["tasks"] })
  .use(authPlugin)
  .get(
    "/",
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
    { query: TaskQuery },
  )
  .patch(
    "/:id",
    async ({ params, body, status }) => {
      const [row] = await db.update(tasks).set({ ...body, updatedAt: new Date() }).where(eq(tasks.id, params.id)).returning();
      return row ?? status(404, { error: "task not found" });
    },
    { auth: true, params: IdParam, body: TaskUpdate },
  );
