import type { Issue, RunResult } from "@playerpulse/pipeline";

export type { Issue, RunResult };
export type RunMessage = RunResult["messages"][number];

export interface ModelInfo {
  id: string;
  in: number;
  out: number;
}

export interface ModelsResponse {
  default: string;
  models: ModelInfo[];
  live: boolean;
}

export interface RunRow {
  id: string;
  name: string;
  scenario: string;
  game: string;
  model: string;
  telemetry: 0 | 1 | boolean;
  status: string;
  costUsd: number;
  seconds: number;
  messagesProcessed: number;
  createdAt: string | number;
}

export interface RunDetail extends RunRow {
  result: RunResult | null;
}

export type TaskState = "todo" | "in_progress" | "done" | "wont_fix";

export interface Task {
  id: string;
  state: TaskState;
  assignee: string | null;
  tags: string[];
  issueId: string | null;
  runId: string;
  priority: number | null;
  title: string;
  category: string;
  severity: string | null;
  level: number | null;
  levelName: string | null;
  playersLost: number | null;
  reports: number | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("Can't reach the PlayerPulse API. Is the API service running on port 4000?", 0);
  }
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : res.status >= 500
          ? `The API returned ${res.status}. Is the API service running?`
          : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return body as T;
}

export const api = {
  models: () => request<ModelsResponse>("/api/models"),
  runs: () => request<RunRow[]>("/api/runs"),
  run: (id: string) => request<RunDetail>(`/api/runs/${id}`),
  createRun: (body: { scenario: "A" | "B"; telemetry: boolean; model: string }) =>
    request<{ id: string }>("/api/runs", { method: "POST", body: JSON.stringify(body) }),
  tasks: (runId: string) => request<Task[]>(`/api/tasks?runId=${encodeURIComponent(runId)}`),
  patchTask: (id: string, body: Partial<Pick<Task, "state" | "assignee" | "tags">>) =>
    request<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

export const fmt = {
  int: (n: number | null | undefined) => (n == null ? "–" : Math.round(n).toLocaleString("en-US")),
  pct: (n: number | null | undefined) => (n == null ? "–" : `${Math.round(n * 100)}%`),
  dec: (n: number | null | undefined, d = 1) => (n == null ? "–" : n.toFixed(d)),
  usd: (n: number | null | undefined) =>
    n == null ? "–" : n < 0.01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`,
  date: (v: string | number) => {
    const d = new Date(typeof v === "number" && v < 1e12 ? v * 1000 : v);
    return Number.isNaN(d.getTime())
      ? String(v)
      : d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  },
};

export const LANGUAGE_NAMES: Record<string, string> = {
  az: "Azerbaijani",
  ru: "Russian",
  en: "English",
  tr: "Turkish",
};

export function langLabel(l: string) {
  const k = l.toLowerCase();
  return k.length <= 3 ? k.toUpperCase() : l;
}
