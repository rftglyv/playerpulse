// Render the animated outro (OG card style) to a frame-perfect 60 fps MP4.
//
//   node scripts/video/outro.mjs [out.mp4] [seconds] [page.html]   (outro.html = OG card, team.html = deck last slide)
//
// Seeks the anime.js timeline to exactly n/60 s for every frame, so timing is deterministic.
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const [out = "outro.mp4", secs = "6", pageName = "outro.html"] = process.argv.slice(2);
const W = 1920, H = 1080, FPS = 60, FRAMES = Math.round(Number(secs) * FPS);
const here = new URL(".", import.meta.url).pathname;
const root = resolve(here, "../..");
const FFMPEG = process.env.FFMPEG ?? execFileSync("python3", ["-c", "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())"]).toString().trim();

// page: inline the brand mark's shapes so each heart pixel can animate
const mark = readFileSync(join(root, "apps/web/public/brand/mark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const animeJs = join(root, "apps/web/node_modules/animejs/dist/bundles/anime.umd.min.js");
const work = mkdtempSync(join(tmpdir(), "pp-outro-"));
const page = join(work, "outro.html");
writeFileSync(page, readFileSync(join(here, pageName), "utf8").replace("__MARK__", mark).replace("__ANIME__", "file://" + animeJs).replaceAll("__ASSETS__", "file://" + join(here, "assets")));

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--remote-debugging-port=9398", `--window-size=${W},${H}`, `--user-data-dir=${join(work, "prof")}`, "--allow-file-access-from-files", "about:blank"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1500));
const target = (await (await fetch("http://127.0.0.1:9398/json/list")).json()).find((t) => t.type === "page");
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const waiters = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method && waiters.has(m.method)) { waiters.get(m.method)(); waiters.delete(m.method); }
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const once = (method) => new Promise((r) => waiters.set(method, r));
await new Promise((r) => (ws.onopen = r));
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "file://" + page });
await new Promise((r) => setTimeout(r, 2500));
await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true });

// freeze time, start the timeline, then advance one frame at a time
await send("Runtime.evaluate", { expression: "window.__play()" }); // builds the paused timeline

const enc = spawn(FFMPEG, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
for (let f = 0; f < FRAMES; f++) {
  // jump the anime.js timeline to this frame's exact time, let the page paint, capture
  await send("Runtime.evaluate", { expression: `window.__seek(${(f * 1000) / FPS}); new Promise((r) => requestAnimationFrame(() => r(1)))`, awaitPromise: true });
  const shot = await send("Page.captureScreenshot", { format: "png" });
  enc.stdin.write(Buffer.from(shot.data, "base64"));
}
enc.stdin.end();
await new Promise((r) => enc.on("close", r));
ws.close();
chrome.kill();
try { rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
console.log(`${out}: ${secs} s, ${FRAMES} frames at ${FPS} fps`);
process.exit(0);
