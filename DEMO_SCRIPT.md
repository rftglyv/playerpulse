# Demo script (2 minutes)

All numbers are from the committed runs (`demo/`, `TESTING.md`).

| Time | Screen | Say |
|---|---|---|
| 0:00 | Landing hero | "After a patch, studios drown in complaints — Azerbaijani, Russian, English, mixed, sarcastic. Telemetry knows *where* players drop. Players know *why*. Nobody connects the two." |
| 0:20 | `/dashboard` → New run → Scenario A, telemetry on (or the preloaded demo run) | "180 messages from Discord, Steam and in-game. One run: ~30 seconds, about $0.38." |
| 0:40 | **Issues** → #1 Twin Bridges | "#1: players fall through the stone ledge after the second bridge. Completion 80% → 43%, deaths flat — that's a blocker, not difficulty. 2,946 players lost. Cause quoted from the patch notes: 'Physics and collision optimisation'. Repro steps and evidence in four languages, one click to a GitHub issue." |
| 1:05 | **Dismissed with proof** → Thorn Canyon | "The loudest group says level 3 is impossible. Completion 85% → 84%, deaths 3.2 → 3.3. Nothing changed. Dismissed — with the numbers. But a real bug is never silenced: the Russian text overlap on level 9 moves no telemetry and still gets reported." |
| 1:25 | README / TESTING.md table | "Against three baselines on a held-out test: 5/5 issues, 0 false alarms, 100% message accuracy vs 59% for keyword filters, 0 of 23 'too hard' complaints wrongly flagged vs 16. On the held-out game we never tuned on: 4/4, 98%. One failure we show: B032, 'guards see through walls' read as a bug." |
| 1:45 | Footer cost meter / Tasks tab | "≈ $0.21 per 100 messages. Issues become P0/P1/P2 tasks. Next: Steam and Discord connectors, run on every patch." |
| 2:00 | End | "Telemetry knows where. Players know why. PlayerPulse settles it." |
