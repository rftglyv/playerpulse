// Scripted product video: drives the real app in headless Chrome with a visible cursor and encodes an MP4.
//
//   node scripts/video/record.mjs <scene> <out.mp4> [baseUrl]
//   scenes: sample (5 s landing), demo (full walkthrough)
//
// Record against a production build (docker compose) so no dev overlays appear.
// Needs Chrome and ffmpeg (FFMPEG env, or `python3 -m pip install imageio-ffmpeg`).
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [scene = "sample", out = "video.mp4", BASE = "http://localhost:3100"] = process.argv.slice(2);
const W = 1920, H = 1080, FPS = 30;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FFMPEG =
  process.env.FFMPEG ??
  execFileSync("python3", ["-c", "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())"]).toString().trim();

// ---------- cursor drawn inside the page, driven by real mouse events ----------
const CURSOR_JS = `
(() => {
  if (window.__ppCursor) return; window.__ppCursor = true;
  const mount = () => {
    const c = document.createElement('div');
    c.id = '__pp_cursor';
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28"><path d="M5 3 L5 22 L10 17.5 L13.5 25 L17 23.5 L13.5 16 L20 16 Z" fill="#0a0a0a" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', width: '28px', height: '28px', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(-200px,-200px)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.25))' });
    document.documentElement.appendChild(c);
    let x = -200, y = -200;
    addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; c.style.transform = 'translate(' + (x - 4) + 'px,' + (y - 3) + 'px)'; }, true);
    addEventListener('mousedown', () => {
      const r = document.createElement('div');
      Object.assign(r.style, { position: 'fixed', left: (x - 18) + 'px', top: (y - 18) + 'px', width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #2563eb', zIndex: 2147483646, pointerEvents: 'none', opacity: '0.9', transform: 'scale(.3)', transition: 'transform .45s cubic-bezier(.16,1,.3,1), opacity .45s' });
      document.documentElement.appendChild(r);
      requestAnimationFrame(() => { r.style.transform = 'scale(1.4)'; r.style.opacity = '0'; });
      setTimeout(() => r.remove(), 500);
    }, true);
  };
  // recording-only: hide the landing's floating "Replay animation" button
  const st = document.createElement('style'); st.textContent = '.lp .replay{display:none!important}';
  const addStyle = () => (document.head || document.documentElement).appendChild(st);
  if (document.documentElement) { mount(); addStyle(); } else addEventListener('DOMContentLoaded', () => { mount(); addStyle(); });
})();`;

// ---------- CDP plumbing ----------
const prof = mkdtempSync(join(tmpdir(), "pp-rec-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--remote-debugging-port=9377", `--window-size=${W},${H}`, `--user-data-dir=${prof}`, "--force-device-scale-factor=1", "about:blank"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1500));
const targets = await (await fetch("http://127.0.0.1:9377/json/list")).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const frames = []; // { t: seconds, data: base64 jpeg }
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === "Page.screencastFrame") {
    frames.push({ t: m.params.metadata.timestamp, data: m.params.data });
    send("Page.screencastFrameAck", { sessionId: m.params.sessionId });
  }
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => (ws.onopen = r));
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send("Page.addScriptToEvaluateOnNewDocument", { source: CURSOR_JS });
await send("Network.enable");
await send("Network.clearBrowserCookies"); // always start signed out so the video shows the sign-in

// ---------- actions ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const zooms = []; // { t0, t1, x, y, scale } in screencast seconds; eased by render.py
let openZoom = null;
const nowS = () => Date.now() / 1000;
function zoomIn(x, y, scale = 1.6) { zoomOut(); openZoom = { t0: nowS(), x, y, scale }; }
function zoomOut() { if (openZoom) { zooms.push({ ...openZoom, t1: nowS() }); openZoom = null; } }
let mx = W * 0.72, my = H * 0.72;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;

async function goto(path, settle = 1200) {
  await send("Page.navigate", { url: BASE + path });
  await sleep(settle);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: mx, y: my });
}
async function moveTo(x, y, ms = 900) {
  const sx = mx, sy = my, steps = Math.max(8, Math.round(ms / 16));
  // slight arc so it doesn't look robotic
  const cx = (sx + x) / 2 + (y - sy) * 0.08, cy = (sy + y) / 2 - (x - sx) * 0.08;
  for (let i = 1; i <= steps; i++) {
    const t = ease(i / steps), u = 1 - t;
    mx = u * u * sx + 2 * u * t * cx + t * t * x;
    my = u * u * sy + 2 * u * t * cy + t * t * y;
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: mx, y: my });
    await sleep(ms / steps);
  }
}
async function center(selector) {
  const r = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()`);
  if (!r) throw new Error("not found: " + selector);
  return r;
}
// find a visible element by its exact visible text (optionally within a CSS scope)
async function byText(text, scope = "body") {
  const r = await evaluate(`(() => {
    const els = [...document.querySelectorAll(${JSON.stringify(scope)} + ' *')].filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0 && e.textContent.trim() === ${JSON.stringify(text)};
    });
    const el = els[els.length - 1]; if (!el) return null;
    const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  })()`);
  if (!r) throw new Error("text not found: " + text);
  return r;
}
async function clickText(text, scope, ms = 900) { const p = await byText(text, scope); await moveTo(p.x, p.y, ms); await click(null); }
async function waitFor(expr, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await evaluate(expr)) return; await sleep(150); }
  const state = await evaluate(`JSON.stringify({ path: location.pathname, text: document.body ? document.body.innerText.slice(0, 160) : null })`);
  throw new Error("timed out waiting for " + expr + " — page: " + state);
}
async function drag(from, to, ms = 1100) {
  await moveTo(from.x, from.y, 700);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: mx, y: my, button: "left", clickCount: 1 });
  await sleep(150);
  await moveTo(mx + 12, my + 6, 120); // pass the drag activation distance
  await moveTo(to.x, to.y, ms);
  await sleep(250);
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: mx, y: my, button: "left", clickCount: 1 });
}

async function hover(selector, ms = 900) { const p = await center(selector); await moveTo(p.x, p.y, ms); }
async function click(selector, ms = 900) {
  if (selector) await hover(selector, ms);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: mx, y: my, button: "left", clickCount: 1 });
  await sleep(90);
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: mx, y: my, button: "left", clickCount: 1 });
}
async function scroll(dy, ms = 1200) {
  const steps = Math.round(ms / 16);
  let done = 0;
  for (let i = 1; i <= steps; i++) {
    const target = Math.round(dy * ease(i / steps));
    await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: mx, y: my, deltaX: 0, deltaY: target - done });
    done = target;
    await sleep(ms / steps);
  }
}
async function type(selector, text) {
  await click(selector, 600);
  for (const ch of text) { await send("Input.insertText", { text: ch }); await sleep(45); }
}

// ---------- scenes ----------
const EMAIL = process.env.DEMO_EMAIL ?? "judge@playerpulse.app";
const PASSWORD = process.env.DEMO_PASSWORD ?? "playerpulse-judge";

const SCENES = {
  async probe() {
    await goto("/dashboard/overview", 1500);
    await waitFor(`!!document.querySelector('input[type=email]')`, 6000);
    console.log("probe ok");
  },
  async demo() {
    // 1. Landing: the pitch, the two verdicts, the results
    await goto("/", 300);
    await sleep(3200);
    await hover(".hero .ctas .btn-p", 1200);
    await sleep(500);
    await moveTo(W * 0.5, H * 0.6, 700);
    await scroll(1000, 1600); await sleep(1300);   // how it works
    await scroll(1000, 1600); await sleep(2200);   // two verdicts (stamps, count-up)
    await scroll(1100, 1600); await sleep(1800);   // results vs baselines
    // 2. Sign in (the gate shows the login card in place)
    await click(".hdr .btn-p", 900);
    await waitFor(`!!document.querySelector('input[type=email]')`, 4000).catch(() => goto("/dashboard/overview", 1500));
    await waitFor(`!!document.querySelector('input[type=email]')`);
    await sleep(900);
    { const f = await center("form"); zoomIn(f.x, f.y, 1.7); }
    await type("input[type=email]", EMAIL);
    await type("input[type=password]", PASSWORD);
    await click("button[type=submit]", 700);
    await sleep(500); zoomOut();
    await waitFor(`location.pathname.startsWith('/dashboard') && !document.querySelector('input[type=password]') && document.body.innerText.includes('Level funnel')`, 20000);
    await sleep(2400);
    // 3. Overview: hover the funnel's broken levels and the top 3
    { const fun = await byText("Level funnel").catch(() => null); if (fun) { zoomIn(fun.x + 220, fun.y + 170, 1.55); await moveTo(fun.x + 200, fun.y + 190, 1000); await sleep(1800); zoomOut(); } }
    await sleep(600);
    await scroll(600, 1200); await sleep(1600);
    await scroll(-600, 900); await sleep(400);
    // 4. Issues -> #1 detail
    await clickText("Issues", "[data-sidebar=content]", 900);
    await waitFor(`location.pathname === '/dashboard/issues'`, 4000).catch(() => goto('/dashboard/issues', 1500));
    await sleep(1800);
    await click("a[href^='/dashboard/issues/']", 900);
    await waitFor(`location.pathname.startsWith('/dashboard/issues/')`);
    await sleep(900); zoomOut();
    await sleep(700);
    await scroll(700, 1400); await sleep(1600);
    await scroll(900, 1400); await sleep(1600);
    // 5. Dismissed with proof
    await clickText("Dismissed with proof", "[data-sidebar=content]", 900);
    await waitFor(`location.pathname === '/dashboard/dismissed'`, 4000).catch(() => goto('/dashboard/dismissed', 1500));
    await sleep(2600);
    // 6. Tasks: drag #1 into In progress
    await clickText("Tasks", "[data-sidebar=content]", 900);
    await waitFor(`location.pathname === '/dashboard/tasks' && !!document.querySelector('[data-slot=card]')`, 5000).catch(() => goto('/dashboard/tasks', 2500));
    await sleep(1500);
    const card = await evaluate(`(() => { const c = [...document.querySelectorAll('[data-slot=card]')].find((e) => e.innerText.includes('players')); if (!c) return null; const b = c.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + 30 }; })()`);
    const col = await byText("In progress");
    if (card) { zoomIn((card.x + col.x) / 2, card.y + 60, 1.45); await drag(card, { x: col.x, y: col.y + 90 }); await sleep(1300); zoomOut(); await sleep(600); }
    // 7. Player voices, then back to overview
    await clickText("Player voices", "[data-sidebar=content]", 900);
    await sleep(2400);
    await scroll(500, 1200); await sleep(1200);
    await clickText("Overview", "[data-sidebar=content]", 900);
    await sleep(2200);
  },
  async sample() {
    await goto("/", 300);
    await sleep(3000); // hero animation: headline reveal, console, 2,946 count-up, doodles
    const b = await center(".hero .ctas .btn-p");
    zoomIn(b.x + 140, b.y - 60, 1.6);
    await hover(".hero .ctas .btn-p", 1300);
    await sleep(1400);
  },
};

if (!SCENES[scene]) throw new Error(`unknown scene ${scene}`);
await send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
await SCENES[scene]();
await sleep(300);
await send("Page.stopScreencast");
ws.close();
chrome.kill();

// ---------- hand frames + zoom timeline to render.py (60 fps, eased zooms) ----------
zoomOut();
const cap = mkdtempSync(join(tmpdir(), "pp-cap-"));
const { mkdirSync } = await import("node:fs");
mkdirSync(join(cap, "frames"));
const index = frames.map((f, i) => {
  const file = `${String(i).padStart(5, "0")}.jpg`;
  writeFileSync(join(cap, "frames", file), Buffer.from(f.data, "base64"));
  return { t: f.t, file };
});
writeFileSync(join(cap, "frames.json"), JSON.stringify(index));
writeFileSync(join(cap, "zooms.json"), JSON.stringify(zooms));
const here = new URL(".", import.meta.url).pathname;
execFileSync("python3", [join(here, "render.py"), cap, out], { stdio: "inherit" });
rmSync(cap, { recursive: true, force: true });
rmSync(prof, { recursive: true, force: true });
process.exit(0);
