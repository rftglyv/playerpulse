import { IdParam, TaskQuery, TaskUpdate } from "@playerpulse/api-schemas";
import { db, issues, runs, tasks } from "@playerpulse/db";
import { and, asc, eq, inArray } from "drizzle-orm";
import { Elysia } from "elysia";
import { authPlugin } from "../auth";

export const taskRoutes = new Elysia({ prefix: "/tasks", tags: ["tasks"] })
  .use(authPlugin)
  .get(
    "/",
    ({ query, user }) =>
      db
        .select({
          id: tasks.id, state: tasks.state, assignee: tasks.assignee, tags: tasks.tags, updatedAt: tasks.updatedAt,
          issueId: issues.id, runId: issues.runId, priority: issues.priority, title: issues.title, category: issues.category,
          severity: issues.severity, level: issues.level, levelName: issues.levelName, playersLost: issues.playersLost,
          reports: issues.reports,
        })
        .from(tasks)
        .innerJoin(issues, eq(tasks.issueId, issues.id))
        .innerJoin(runs, eq(issues.runId, runs.id))
        .where(and(eq(runs.createdBy, user.id), query.runId ? eq(issues.runId, query.runId) : undefined))
        .orderBy(asc(issues.priority)),
    { auth: true, query: TaskQuery },
  )
  .patch(
    "/:id",
    async ({ params, body, status, user }) => {
      // only tasks that belong to one of the user's own runs
      const owned = db
        .select({ id: tasks.id })
        .from(tasks)
        .innerJoin(issues, eq(tasks.issueId, issues.id))
        .innerJoin(runs, eq(issues.runId, runs.id))
        .where(and(eq(tasks.id, params.id), eq(runs.createdBy, user.id)));
      const [row] = await db
        .update(tasks)
        .set({ ...body, updatedAt: new Date() })
        .where(inArray(tasks.id, owned))
        .returning();
      return row ?? status(404, { error: "task not found" });
    },
    { auth: true, params: IdParam, body: TaskUpdate },
  );
