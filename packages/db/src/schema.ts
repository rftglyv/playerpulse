import { index, integer, jsonb, pgEnum, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const runStatus = pgEnum("run_status", ["running", "done", "failed"]);
export const issueStatus = pgEnum("issue_status", ["reported", "dismissed", "watch"]);
export const issueCategory = pgEnum("issue_category", ["bug", "balance", "skill_issue"]);
export const taskState = pgEnum("task_state", ["todo", "in_progress", "done", "wont_fix"]);
export const severity = pgEnum("severity", ["blocker", "major", "minor", "cosmetic"]);

/** One pipeline run over one feedback source (scenario, upload, Steam). */
export const runs = pgTable("runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  scenario: text("scenario").notNull(),
  game: text("game").notNull(),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  telemetry: integer("telemetry").notNull(), // 1 = with telemetry, 0 = community-only
  status: runStatus("status").notNull().default("running"),
  error: text("error"),
  messagesProcessed: integer("messages_processed").notNull().default(0),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  costUsd: real("cost_usd").notNull().default(0),
  seconds: real("seconds").notNull().default(0),
  result: jsonb("result"), // full predictions contract, as written by the pipeline
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A verified issue, flattened from a run so it can be queried, filtered and tracked. */
export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
    priority: integer("priority"),
    title: text("title").notNull(),
    status: issueStatus("status").notNull(),
    category: issueCategory("category").notNull(),
    severity: severity("severity"),
    level: integer("level"),
    levelName: text("level_name"),
    mechanic: text("mechanic").notNull(),
    playersLost: integer("players_lost").notNull().default(0),
    reports: integer("reports").notNull(),
    distinctPlayers: integer("distinct_players").notNull(),
    telemetryEvidence: text("telemetry_evidence").notNull(),
    detail: jsonb("detail").notNull(), // ticket, evidence, telemetry rows
  },
  (t) => [index("issues_run_idx").on(t.runId)],
);

/** A fix task the studio tracks, created from a reported issue. */
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
    state: taskState("state").notNull().default("todo"),
    assignee: text("assignee"),
    tags: text("tags").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_issue_idx").on(t.issueId)],
);
