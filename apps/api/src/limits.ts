/** In-memory guards for the public demo (single instance): one live run at a time, per-IP hourly and global daily caps. */

const HOUR = 3_600_000;
const DAY = 86_400_000;
export const MAX_BODY_BYTES = 3 * 1024 * 1024;

const envInt = (name: string, fallback: number) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export const demoReadonly = () => process.env.DEMO_READONLY === "true";

let busy = false;
const perIp = new Map<string, number[]>();
let daily: number[] = [];

const prune = (stamps: number[], windowMs: number, now: number) => stamps.filter((t) => now - t < windowMs);
const retryAfter = (oldest: number, windowMs: number, now: number) => Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));

export type Denied = { error: string; retry_after_s: number };

/** Reserve a live-run slot. Returns a release fn, or a 429 payload. */
export function acquireRun(ip: string): { release: () => void } | { denied: Denied } {
  const now = Date.now();
  if (busy) return { denied: { error: "a run is already in progress, try again in a minute", retry_after_s: 60 } };

  daily = prune(daily, DAY, now);
  const perDay = envInt("RUNS_PER_DAY", 100);
  if (daily.length >= perDay) {
    return { denied: { error: `daily limit of ${perDay} live runs reached for this demo`, retry_after_s: retryAfter(daily[0], DAY, now) } };
  }

  const mine = prune(perIp.get(ip) ?? [], HOUR, now);
  const perHour = envInt("RUNS_PER_IP_PER_HOUR", 5);
  if (mine.length >= perHour) {
    perIp.set(ip, mine);
    return { denied: { error: `limit of ${perHour} live runs per hour reached for your IP`, retry_after_s: retryAfter(mine[0], HOUR, now) } };
  }

  busy = true;
  mine.push(now);
  perIp.set(ip, mine);
  daily.push(now);
  return { release: () => { busy = false; } };
}

export function clientIp(request: Request, server: { requestIP(r: Request): { address: string } | null } | null): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || server?.requestIP(request)?.address || "unknown";
}

export class BodyTooLarge extends Error {}

/** Read a body stream with a hard cap (covers chunked uploads that have no content-length). */
export async function readCapped(request: Request, max = MAX_BODY_BYTES): Promise<string> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      throw new BodyTooLarge();
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}
