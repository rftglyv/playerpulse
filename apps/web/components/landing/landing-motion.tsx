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
    animate(p, { strokeDashoffset: [len, 0], duration: 1500, delay: delay + i * 140, ease: "outQuart" });
  });
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
    });
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
    q(r, "[data-count]").forEach((el) => countUp(el, 1750, 1900));
    draw(Array.from(r.querySelectorAll<SVGPathElement>(".trace .draw")), 1800);
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
  },
  results(r) {
    fade(r);
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
 * Landing-page motion: frosted header on scroll, section entrance sequences
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

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      return () => window.removeEventListener("scroll", onScroll);
    }

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
      window.removeEventListener("scroll", onScroll);
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
