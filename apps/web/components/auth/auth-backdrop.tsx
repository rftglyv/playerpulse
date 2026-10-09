"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";

/* Same hand-drawn doodles as the landing hero (paths use pathLength=1 so draw-in is offset 1 -> 0). */
const DOODLES: { viewBox: string; w: number; tone: "ink" | "blue"; paths: { d: string; sw: number }[] }[] = [
  {
    viewBox: "0 0 84 52", w: 64, tone: "ink",
    paths: [
      { sw: 2, d: "M22 8 C 10 8, 4 22, 4 34 C 4 46, 14 50, 20 42 C 24 36, 28 34, 42 34 C 56 34, 60 36, 64 42 C 70 50, 80 46, 80 34 C 80 22, 74 8, 62 8 C 52 8, 50 12, 42 12 C 34 12, 32 8, 22 8" },
      { sw: 2, d: "M20 18 L 20 30 M14 24 L 26 24" },
      { sw: 2, d: "M60 19 C 62 19, 62 22, 60 22 C 58 22, 58 19, 60 19 M66 25 C 68 25, 68 28, 66 28 C 64 28, 64 25, 66 25" },
    ],
  },
  { viewBox: "0 0 40 40", w: 28, tone: "blue", paths: [{ sw: 2, d: "M20 4 L 24 15 L 36 16 L 27 24 L 30 36 L 20 29 L 10 36 L 13 24 L 4 16 L 16 15 Z" }] },
  { viewBox: "0 0 40 40", w: 30, tone: "ink", paths: [{ sw: 2, d: "M20 4 L 20 12 M20 28 L 20 36 M4 20 L 12 20 M28 20 L 36 20 M8 8 L 13 13 M27 27 L 32 32 M32 8 L 27 13 M8 32 L 13 27" }] },
  {
    viewBox: "0 0 36 32", w: 28, tone: "blue",
    paths: [{ sw: 2, d: "M6 4 L 12 4 L 12 8 L 16 8 L 16 4 L 22 4 M22 4 L 28 4 L 28 8 L 32 8 L 32 16 L 28 16 L 28 20 L 24 20 L 24 24 L 20 24 L 20 28 L 16 28 L 16 24 L 12 24 L 12 20 L 8 20 L 8 16 L 4 16 L 4 8 L 6 8 L 6 4" }],
  },
  {
    viewBox: "0 0 52 44", w: 42, tone: "ink",
    paths: [
      { sw: 2, d: "M8 6 C 22 3, 38 3, 46 7 C 50 12, 50 24, 46 28 C 38 31, 26 31, 18 30 L 9 38 L 11 29 C 5 27, 3 20, 4 13 C 4 9, 5 7, 8 6" },
      { sw: 2.4, d: "M27 11 L 27 19 M27 23 L 27 24" },
    ],
  },
  {
    viewBox: "0 0 36 36", w: 28, tone: "blue",
    paths: [
      { sw: 2, d: "M18 4 C 27 4, 32 10, 32 18 C 32 27, 26 32, 18 32 C 9 32, 4 26, 4 18 C 4 10, 10 4, 19 4" },
      { sw: 2, d: "M18 11 L 18 25" },
    ],
  },
];

const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

/** Random spot outside the centred login card (keeps doodles in the margins). */
function randomSpot() {
  for (let i = 0; i < 20; i++) {
    const x = 4 + Math.random() * 88;
    const y = 6 + Math.random() * 84;
    if (!(x > 28 && x < 72 && y > 18 && y < 82)) return { x, y };
  }
  return { x: Math.random() < 0.5 ? 8 : 86, y: 10 + Math.random() * 80 };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Low-opacity animated 1-bit dither + looping doodles behind the sign-in card. */
export function AuthBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doodleRefs = useRef<(SVGSVGElement | null)[]>([]);

  // Dither: a slowly drifting blue field, Bayer 8x8, redrawn ~8 fps on a tiny canvas scaled up.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const PX = 4;
    let raf = 0;
    let last = 0;
    let W = 0;
    let H = 0;
    const size = () => {
      W = Math.ceil(window.innerWidth / PX);
      H = Math.ceil(window.innerHeight / PX);
      canvas.width = W;
      canvas.height = H;
    };
    const draw = (t: number) => {
      const img = ctx.createImageData(W, H);
      const d = img.data;
      const s = t / 9000;
      for (let y = 0; y < H; y++) {
        const v = y / H;
        for (let x = 0; x < W; x++) {
          const u = x / W;
          // two soft waves, strongest at the bottom edge
          const f =
            Math.pow(v, 2.2) * 0.55 +
            0.12 * Math.sin(u * 7 + s * 2.1) * v +
            0.08 * Math.sin(u * 13 - s * 1.3 + v * 4) * v;
          if (f * 64 > BAYER[(y & 7) * 8 + (x & 7)] + 0.5) {
            const i = (y * W + x) * 4;
            d[i] = 37; d[i + 1] = 99; d[i + 2] = 235; d[i + 3] = 255;
          }
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    const loop = (t: number) => {
      if (t - last > 120) {
        draw(t);
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    size();
    draw(0);
    if (!reduce) raf = requestAnimationFrame(loop);
    const onResize = () => {
      size();
      draw(performance.now());
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Doodles: each one draws in at a random spot, holds, dissolves in reverse, then moves somewhere else.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alive = true;
    const els = doodleRefs.current.filter((e): e is SVGSVGElement => !!e);

    const place = (el: SVGSVGElement) => {
      const { x, y } = randomSpot();
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.style.transform = `translate(-50%, -50%) rotate(${Math.round(Math.random() * 36 - 18)}deg) scale(${(0.85 + Math.random() * 0.5).toFixed(2)})`;
    };

    if (reduce) {
      els.forEach((el) => {
        place(el);
        el.style.opacity = "1";
      });
      return;
    }

    const cycle = async (el: SVGSVGElement, index: number) => {
      const paths = Array.from(el.querySelectorAll("path"));
      await sleep(400 + index * 900);
      while (alive) {
        place(el);
        paths.forEach((p) => {
          p.style.strokeDasharray = "1";
          p.style.strokeDashoffset = "1";
        });
        el.style.opacity = "1";
        await Promise.all(
          paths.map((p, i) =>
            animate(p, { strokeDashoffset: [1, 0], duration: 1100, delay: i * 220, ease: "inOutQuad" }).then(() => {}),
          ),
        );
        await sleep(1800 + Math.random() * 1600);
        if (!alive) break;
        // reverse dissolve: undraw from the start of the stroke while fading out
        await Promise.all([
          ...paths.map((p) => animate(p, { strokeDashoffset: [0, -1], duration: 1000, ease: "inOutQuad" }).then(() => {})),
          animate(el, { opacity: [1, 0], duration: 1000, ease: "inQuad" }).then(() => {}),
        ]);
        await sleep(600 + Math.random() * 1800);
      }
    };
    els.forEach((el, i) => void cycle(el, i));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-[0.14]"
        style={{ imageRendering: "pixelated" }}
      />
      {DOODLES.map((dd, i) => (
        <svg
          key={i}
          ref={(el) => {
            doodleRefs.current[i] = el;
          }}
          viewBox={dd.viewBox}
          width={dd.w}
          className="absolute overflow-visible opacity-0"
          style={{ left: "50%", top: "50%" }}
        >
          {dd.paths.map((p, j) => (
            <path
              key={j}
              d={p.d}
              pathLength={1}
              strokeWidth={p.sw}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke={dd.tone === "blue" ? "#2563EB" : "#0A0A0A"}
              strokeOpacity={dd.tone === "blue" ? 0.55 : 0.4}
            />
          ))}
        </svg>
      ))}
    </div>
  );
}
