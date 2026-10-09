import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const MODELS = [
  { id: "anthropic/claude-sonnet-5.5", in: 2, out: 10 },
  { id: "anthropic/claude-haiku-5.5", in: 0.1, out: 0.5 },
  { id: "google/gemini-3.8-flash", in: 0.75, out: 3.75 },
  { id: "openai/gpt-5.6-luna", in: 0.2, out: 1.2 },
] as const; // USD per 1M tokens, from https://openrouter.ai/api/v1/models (2026-10-09)

export const DEFAULT_MODEL = process.env.OPENROUTER_MODEL ?? MODELS[0].id;

export class LlmMeter {
  tokens_in = 0;
  tokens_out = 0;
  cost_usd = 0;
  calls = 0;
  cache_hits = 0;
}

const CACHE_DIR = process.env.PP_CACHE_DIR ?? join(process.cwd(), ".cache", "llm");

/** One chat call that must return JSON. Cached on disk by hash(model + prompt version + prompt). */
export async function llmJson<T>(opts: {
  model: string;
  promptVersion: string;
  system: string;
  user: string;
  meter: LlmMeter;
  parse: (raw: unknown) => T; // throws on schema mismatch
}): Promise<T> {
  const key = createHash("sha256")
    .update([opts.model, opts.promptVersion, opts.system, opts.user].join("\u0000"))
    .digest("hex");
  const path = join(CACHE_DIR, key + ".json");
  if (existsSync(path)) {
    opts.meter.cache_hits++;
    return opts.parse(JSON.parse(readFileSync(path, "utf8")));
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set (cached results only)");

  let messages = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "PlayerPulse" },
      body: JSON.stringify({
        model: opts.model,
        temperature: 0,
        response_format: { type: "json_object" },
        usage: { include: true },
        messages,
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const body = await res.json();
    opts.meter.calls++;
    const usage = body.usage ?? {};
    opts.meter.tokens_in += usage.prompt_tokens ?? 0;
    opts.meter.tokens_out += usage.completion_tokens ?? 0;
    const price = MODELS.find((m) => m.id === opts.model);
    opts.meter.cost_usd +=
      typeof usage.cost === "number"
        ? usage.cost
        : price
          ? ((usage.prompt_tokens ?? 0) * price.in + (usage.completion_tokens ?? 0) * price.out) / 1e6
          : 0;
    const content: string = body.choices?.[0]?.message?.content ?? "";
    try {
      const raw = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, ""));
      const parsed = opts.parse(raw);
      mkdirSync(CACHE_DIR, { recursive: true });
      writeFileSync(path, JSON.stringify(raw));
      return parsed;
    } catch (err) {
      // one repair retry
      messages = [
        ...messages,
        { role: "assistant", content },
        { role: "user", content: `That was not valid JSON for the schema (${String(err).slice(0, 200)}). Return only the corrected JSON.` },
      ];
    }
  }
  throw new Error("LLM returned invalid JSON twice");
}
