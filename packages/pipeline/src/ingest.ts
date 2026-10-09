import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { GameInfo, Message, Scenario, TelemetryRow } from "./types";

/** RFC-4180-ish CSV parser: quoted fields, escaped quotes, newlines inside quotes. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

export const hashAuthor = (a: string) => "p_" + createHash("sha256").update(a).digest("hex").slice(0, 10);

export function parseMessages(csv: string): Message[] {
  return parseCsv(csv)
    .filter((r) => r.id && r.text !== undefined)
    .map((r) => ({
      id: r.id,
      timestamp: r.timestamp ?? "",
      channel: r.channel ?? "",
      author: hashAuthor(r.author ?? r.id),
      text: r.text ?? "",
    }));
}

export function parseTelemetry(csv: string): TelemetryRow[] {
  return parseCsv(csv).map((r) => ({
    patch: r.patch,
    level: Number(r.level),
    players_started: Number(r.players_started),
    players_completed: Number(r.players_completed),
    completion_rate: Number(r.completion_rate),
    deaths_per_player: Number(r.deaths_per_player),
    restarts_per_player: Number(r.restarts_per_player),
    error_reports: Number(r.error_reports),
    median_minutes: Number(r.median_minutes),
  }));
}

export function parseGameInfo(json: string): GameInfo {
  const raw = JSON.parse(json);
  const notesKey = Object.keys(raw).find((k) => k.startsWith("patch_notes"));
  return { ...raw, patch_notes: notesKey ? raw[notesKey] : [] };
}

export function loadScenarioDir(dir: string, useTelemetry = true): Scenario {
  const game = parseGameInfo(readFileSync(join(dir, "game_info.json"), "utf8"));
  const messages = parseMessages(readFileSync(join(dir, "messages.csv"), "utf8"));
  const tPath = join(dir, "telemetry.csv");
  const telemetry = useTelemetry && existsSync(tPath) ? parseTelemetry(readFileSync(tPath, "utf8")) : null;
  return { name: game.scenario, game, messages, telemetry };
}
