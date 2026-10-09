import { PALETTE } from "./mini";

/** Inline lollipop: hollow neutral dot at prev, filled dot at cur, stem between. Red when worse by ≥5 pts. */
export function CompletionLollipop({
  prev,
  cur,
}: {
  prev: number;
  cur: number;
}) {
  const w = 112;
  const h = 14;
  const pad = 5;
  const x = (v: number) => pad + Math.max(0, Math.min(1, v)) * (w - pad * 2);
  const worse = (prev - cur) * 100 >= 5;
  const color = worse ? PALETTE.red : PALETTE.blue;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-3.5 w-28 shrink-0" aria-hidden>
      <line
        x1={pad}
        x2={w - pad}
        y1={h / 2}
        y2={h / 2}
        stroke="currentColor"
        strokeOpacity={0.12}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={x(t)}
          x2={x(t)}
          y1={h / 2 - 2}
          y2={h / 2 + 2}
          stroke="currentColor"
          strokeOpacity={0.18}
        />
      ))}
      <line
        x1={x(prev)}
        x2={x(cur)}
        y1={h / 2}
        y2={h / 2}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle
        cx={x(prev)}
        cy={h / 2}
        r={3.2}
        fill="var(--card)"
        stroke={PALETTE.neutral}
        strokeWidth={1.6}
      />
      <circle cx={x(cur)} cy={h / 2} r={3.8} fill={color} />
    </svg>
  );
}
