export type ReportType = "technical_bug" | "difficulty_claim" | "noise";
export type MessageCategory = "bug" | "balance" | "skill_issue" | "noise";
export type IssueStatus = "reported" | "dismissed" | "watch";
export type IssueCategory = "bug" | "balance" | "skill_issue";

export interface Message {
  id: string;
  timestamp: string;
  channel: string;
  author: string; // hashed before it reaches the LLM
  text: string;
}

export interface TelemetryRow {
  patch: string;
  level: number;
  players_started: number;
  players_completed: number;
  completion_rate: number;
  deaths_per_player: number;
  restarts_per_player: number;
  error_reports: number;
  median_minutes: number;
}

export interface GameInfo {
  scenario: string;
  game: string;
  genre: string;
  unit: string;
  previous_patch: string;
  current_patch: string;
  patch_date: string;
  levels: Record<string, string>;
  patch_notes: string[];
}

export interface Scenario {
  name: string;
  game: GameInfo;
  messages: Message[];
  telemetry: TelemetryRow[] | null; // null = community-only mode
}

export interface Extraction {
  id: string;
  level: number | null;
  level_evidence: string | null;
  mechanic: string | null;
  symptom: string | null;
  report_type: ReportType;
  sarcastic: boolean;
  language: string;
  english_translation: string;
  confidence: number;
  extraction_failed?: boolean;
}

export interface Group {
  key: string;
  level: number | null;
  mechanic: string;
  kind: "technical_bug" | "difficulty_claim";
  message_ids: string[];
  authors: Set<string>;
}

export interface LevelDelta {
  prev: TelemetryRow;
  cur: TelemetryRow;
  d_completion: number;
  r_deaths: number;
  r_restarts: number;
  r_errors: number;
}

export interface Ticket {
  title: string;
  summary: string;
  suspected_cause: string;
  repro_steps: string[];
  severity: "blocker" | "major" | "minor" | "cosmetic";
  evidence: { id: string; text: string; english: string }[];
}

export interface Issue {
  title: string;
  category: IssueCategory;
  level: number | null;
  level_name: string | null;
  mechanic: string;
  status: IssueStatus;
  priority?: number;
  message_ids: string[];
  distinct_players: number;
  languages: string[];
  telemetry_evidence: string;
  players_lost_estimate: number;
  error_ratio: number;
  first_report: string | null;
  hours_after_patch: number | null;
  telemetry?: { prev: TelemetryRow; cur: TelemetryRow } | null;
  ticket?: Ticket;
  repro_steps?: string[];
}

export interface RunMeta {
  model: string;
  prompt_version: string;
  telemetry: boolean;
  messages_processed: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  seconds: number;
  llm_calls: number;
  cache_hits: number;
}
