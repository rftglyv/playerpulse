"use client";

import { animate, stagger } from "animejs";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Rotated mono stamp, as on the landing "case files". */
export function Stamp({ tone, children, className }: { tone: "loss" | "proof" | "watch"; children: React.ReactNode; className?: string }) {
  return (
    <span
      data-stamp
      aria-hidden
      style={{ transform: "rotate(-6deg)" }}
      className={cn(
        "pointer-events-none absolute top-5 right-5 rounded-[3px] border-[1.5px] border-current bg-white/88 px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.12em] whitespace-nowrap",
        tone === "loss" && "text-loss",
        tone === "proof" && "text-proof",
        tone === "watch" && "text-watch",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Staggered entrance for case-file cards and stamps. Only "from" values are set inside animate(),
 * so content is fully visible without JS or with reduced motion.
 */
export function Reveal({ children, deps, className }: { children: React.ReactNode; deps: unknown[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-card]"));
    const stamps = Array.from(root.querySelectorAll<HTMLElement>("[data-stamp]"));
    if (cards.length)
      animate(cards, { opacity: [0, 1], translateY: [14, 0], duration: 900, delay: stagger(90), ease: "outExpo" });
    if (stamps.length)
      animate(stamps, {
        opacity: [0, 1],
        scale: [1.5, 1],
        rotate: ["-14deg", "-6deg"],
        duration: 900,
        delay: stagger(120, { start: 250 }),
        ease: "outBack(1.6)",
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
