"use client";

import { animate, stagger } from "animejs";
import { useEffect, useRef, useState } from "react";

const ex = "outExpo";

function q(root: Element, sel: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(sel));
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

function countUp(el: HTMLElement, delay = 0, duration = 1900) {
  const target = Number(el.dataset.count);
  const o = { v: 0 };
  el.textContent = "0";
  animate(o, {
    v: target,
    duration,
    delay,
    ease: "outQuart",
    onUpdate: () => {
      el.textContent = fmt(o.v);
    },
    onComplete: () => {
      el.textContent = fmt(target);
    },
  });
}

function draw(paths: SVGPathElement[], delay: number) {
  paths.forEach((p, i) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = String(len);
    p.style.strokeDashoffset = String(len);
    animate(p, {
      strokeDashoffset: [len, 0],
      duration: 1500,
      delay: delay + i * 140,
      ease: "outQuart",
      onComplete: () => {
        p.style.strokeDasharray = "";
      },
    });
  });
}

/** Hand-drawn doodles: paths use pathLength="1". */
function doodle(svgs: Element[], delay: number) {
  svgs.forEach((s, j) => {
    Array.from(s.querySelectorAll<SVGPathElement>("path")).forEach((p, i) => {
      p.style.strokeDasharray = "1";
      p.style.strokeDashoffset = "1";
      animate(p, { strokeDashoffset: [1, 0], duration: 700, delay: delay + j * 300 + i * 180, ease: "inOutQuad" });
    });
  });
}

/* ---------- 1-bit ordered dither (Bayer 8x8), tiny canvases scaled up with pixelated rendering ---------- */
const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54,
  22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29,
  53, 21,
];

type DitherKind = { px: number; col: [number, number, number]; f: (u: number, v: number) => number };

const DITHER: Record<string, DitherKind> = {
  horizon: {
    px: 3,
    col: [0x25, 0x63, 0xeb],
    f: (u, v) => {
      const w = 0.06 * Math.sin(u * 9.5) + 0.04 * Math.sin(u * 23 + 1.3);
      return Math.max(0, Math.pow(v, 1.8) * 0.5 + w * v);
    },
  },
  fade: {
    px: 3,
    col: [0x0a, 0x0a, 0x0a],
    f: (u, v) => Math.pow(1 - v, 2.4) * 0.32 * (0.75 + 0.25 * Math.cos(u * 6.3)),
  },
  cliff: {
    px: 2,
    col: [0x25, 0x63, 0xeb],
    f: (u, v) => {
      const x = u * 320;
      const y = v * 64;
      const ly = x < 150 ? 14 : x < 170 ? 14 + (x - 150) * 1.6 : 46;
      if (y < ly + 2 || y > 52 || (x > 176 && y > 44)) return 0;
      const t = (y - ly) / (52 - ly);
      return 0.55 * (1 - t) + 0.06;
    },
  },
};

function paintDither(c: HTMLCanvasElement) {
  const k = DITHER[c.dataset.dither ?? ""];
  if (!k) return;
  const r = c.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const W = Math.ceil(r.width / k.px);
  const H = Math.ceil(r.height / k.px);
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const img = ctx.createImageData(W, H);
  const d = img.data;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (k.f(x / W, y / H) * 64 > BAYER[(y & 7) * 8 + (x & 7)] + 0.5) {
        const i = (y * W + x) * 4;
        d[i] = k.col[0];
        d[i + 1] = k.col[1];
        d[i + 2] = k.col[2];
        d[i + 3] = 255;
      }
    }
  ctx.putImageData(img, 0, 0);
}

function stamp(els: HTMLElement[], start: number) {
  if (!els.length) return;
  animate(els, {
    opacity: [0, 1],
    scale: [1.5, 1],
    rotate: ["-14deg", "-6deg"],
    duration: 1000,
    delay: stagger(260, { start }),
    ease: "outBack(1.6)",
  });
}

function fade(r: Element, start = 0) {
  const els = q(r, ".a-fade");
  if (!els.length) return;
  animate(els, { opacity: [0, 1], translateY: [14, 0], duration: 1100, delay: stagger(110, { start }), ease: ex });
}

const runs: Record<string, (r: Element) => void> = {
  hero(r) {
    animate(q(r, ".lines .ln"), {
      clipPath: ["inset(0% 0% 100% 0%)", "inset(0% 0% 0% 0%)"],
      translateY: ["0.4em", 0],
      opacity: [0, 1],
      duration: 1400,
      delay: stagger(180, { start: 120 }),
      ease: ex,
      onComplete: () => {
        q(r, ".lines .ln").forEach((l) => {
          l.style.clipPath = "none";
        });
      },
    });
    doodle(q(r, ".ul svg"), 1500);
    animate(q(r, ".eyebrow"), { opacity: [0, 1], duration: 800, ease: "outQuart" });
    animate(q(r, ".sub, .ctas"), {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 1100,
      delay: stagger(120, { start: 700 }),
      ease: ex,
    });
    animate(q(r, ".a-card"), { opacity: [0, 1], translateY: [18, 0], duration: 1300, delay: 300, ease: ex });
    animate(q(r, ".a-msg"), {
      opacity: [0, 1],
      translateX: [-14, 0],
      duration: 900,
      delay: stagger(240, { start: 650 }),
      ease: ex,
    });
    animate(q(r, ".a-msg .chip"), {
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 600,
      delay: stagger(240, { start: 950 }),
      ease: "outBack",
    });
    animate(q(r, ".a-resolve"), { opacity: [0, 1], duration: 800, delay: 1650, ease: "outQuart" });
    animate(q(r, ".trace canvas"), { opacity: [0, 1], duration: 900, delay: 2300, ease: "outQuart" });
    q(r, "[data-count]").forEach((el) => countUp(el, 1750, 1900));
    draw(Array.from(r.querySelectorAll<SVGPathElement>(".trace .draw")), 1800);
    doodle(q(r, ".circ svg"), 3300);
    stamp(q(r, ".stamp"), 2500);
  },
  how(r) {
    fade(r);
    animate(q(r, ".a-step"), {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 1100,
      delay: stagger(140, { start: 150 }),
      ease: ex,
    });
  },
  files(r) {
    fade(r);
    animate(q(r, ".a-file"), {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 1300,
      delay: stagger(160, { start: 150 }),
      ease: ex,
    });
    animate(q(r, ".ledger div"), {
      opacity: [0, 1],
      translateX: [-10, 0],
      duration: 900,
      delay: stagger(70, { start: 500 }),
      ease: "outQuart",
    });
    q(r, "[data-count]").forEach((el) => countUp(el, 700, 1900));
    stamp(q(r, ".stamp"), 1100);
    doodle(q(r, ".bridge"), 1300);
    doodle(q(r, ".x svg"), 1700);
    doodle(q(r, ".arrow"), 2100);
  },
  results(r) {
    fade(r);
    animate(q(r, ".res-band"), { opacity: [0, 1], duration: 1200, ease: "outQuart" });
    animate(q(r, ".a-score"), {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 1000,
      delay: stagger(90, { start: 150 }),
      ease: ex,
    });
    animate(q(r, ".a-panel"), {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 1100,
      delay: stagger(120, { start: 400 }),
      ease: ex,
    });
    animate(q(r, ".fl"), { scaleX: [0, 1], duration: 1400, delay: stagger(80, { start: 650 }), ease: ex });
  },
  foot(r) {
    fade(r);
  },
};

function run(r: HTMLElement) {
  try {
    runs[r.dataset.anim ?? ""]?.(r);
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Landing-page motion: frosted header on scroll, Bayer-dither canvases (repainted on resize / fonts ready), section entrance sequences
 * (anime.js v4) triggered by IntersectionObserver, and a "Replay animation" button.
 * Content is fully visible without JS; from-values are only set inside animate().
 */
export function LandingMotion() {
  const [canAnimate, setCanAnimate] = useState(false);
  const replayRef = useRef<() => void>(() => {});

  useEffect(() => {
    const hdr = document.getElementById("hdr");
    const onScroll = () => hdr?.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const canvases = Array.from(document.querySelectorAll<HTMLCanvasElement>(".lp canvas.dither"));
    const paintAll = () => canvases.forEach(paintDither);
    paintAll();
    let rt: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(paintAll, 120);
    };
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(paintAll);
    const cleanupBase = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      clearTimeout(rt);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return cleanupBase;

    const secs = Array.from(document.querySelectorAll<HTMLElement>(".lp [data-anim]"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 },
    );
    secs.forEach((s) => io.observe(s));

    replayRef.current = () => {
      secs.forEach((s) => {
        const b = s.getBoundingClientRect();
        if (b.top < window.innerHeight && b.bottom > 0) run(s);
        else io.observe(s);
      });
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reveal button only once motion is available
    setCanAnimate(true);

    return () => {
      cleanupBase();
      io.disconnect();
    };
  }, []);

  if (!canAnimate) return null;
  return (
    <button className="replay" type="button" onClick={() => replayRef.current()}>
      ↻ Replay animation
    </button>
  );
}
