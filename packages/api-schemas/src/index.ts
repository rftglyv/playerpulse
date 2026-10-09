import { z } from "zod";

/** Request/response contracts shared by the Elysia API and the Next.js dashboard. */

export const ScenarioId = z.enum(["A", "B"]);

export const RunCreate = z.object({
  scenario: ScenarioId.optional(),
  upload: z
    .object({
      messages_csv: z.string().min(1).max(2_000_000),
      telemetry_csv: z.string().max(500_000).optional(),
      game_info_json: z.string().max(100_000),
    })
    .optional(),
  telemetry: z.boolean().default(true),
  model: z.string().max(100).optional(),
  name: z.string().max(120).optional(),
});
export type RunCreate = z.infer<typeof RunCreate>;

export const TaskState = z.enum(["todo", "in_progress", "done", "wont_fix"]);
export type TaskState = z.infer<typeof TaskState>;

export const TaskUpdate = z.object({
  state: TaskState.optional(),
  assignee: z.string().max(80).nullable().optional(),
  tags: z.array(z.string().max(40)).max(12).optional(),
});
export type TaskUpdate = z.infer<typeof TaskUpdate>;

export const IdParam = z.object({ id: z.uuid() });
export const TaskQuery = z.object({ runId: z.uuid().optional() });

export const PriorityTag = z.enum(["P0", "P1", "P2"]);
export type PriorityTag = z.infer<typeof PriorityTag>;
