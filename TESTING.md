# Testing

All numbers below come from `eval/evaluate.py` on the committed outputs in `out/`. Reproduce:

```bash
bun run pipeline --scenario eval/data/scenario_A --telemetry on  --out out/pp_A.json
bun run pipeline --scenario eval/data/scenario_A --telemetry off --out out/pp_A_no_telemetry.json
bun run pipeline --scenario eval/data/scenario_B --telemetry on  --out out/pp_B.json
cd eval && python3 evaluate.py --scenario A --pred ../out/pp_A_no_telemetry.json --pred ../out/pp_A.json
python3 evaluate.py --scenario B --pred ../out/pp_B.json
```

Model: `anthropic/claude-sonnet-5.5` via OpenRouter, temperature 0, prompt `extract_v1` (first version, no tuning yet).

## Scenario A — test split (134 messages, 5 planted issues)

| System | Real issues found | False alarms | #1 right | Top-3 | Message accuracy | "Too hard" wrongly flagged | Level correct |
|---|---|---|---|---|---|---|---|
| Baseline: keyword filter | 5/5 | 2 | no | 2/3 | 59% | 16/23 | 56% |
| Baseline: most-mentioned levels | 4/5 | 1 | yes | 2/3 | 55% | 13/23 | 56% |
| Baseline: analytics drop-off only | 3/5 | 0 | yes | 3/3 | n/a | n/a | n/a |
| PlayerPulse, community-only (no telemetry) | 4/5 | 0 | yes | 2/3 | 89% | 0/23 | 100% |
| **PlayerPulse, with telemetry** | **5/5** | **0** | **yes** | **3/3** | **100%** | **0/23** | **100%** |

## Scenario B — held out, run once, never tuned on (66 messages, 4 planted issues)

| System | Real issues found | False alarms | #1 right | Top-3 | Message accuracy | "Too hard" wrongly flagged | Level correct |
|---|---|---|---|---|---|---|---|
| Baseline: keyword filter | 4/4 | 2 | no | 1/3 | 38% | 14/15 | 64% |
| Baseline: most-mentioned levels | 3/4 | 1 | no | 2/3 | 50% | 9/15 | 64% |
| Baseline: analytics drop-off only | 3/4 | 0 | yes | 3/3 | n/a | n/a | n/a |
| **PlayerPulse, with telemetry** | **4/4** | **0** | **yes** | **3/3** | **98%** | **1/15** | **100%** |

Full reports with confusion matrices: `eval/results/scenario_A_test.md`, `eval/results/scenario_B_heldout.md`.

## What telemetry adds (ablation, scenario A)

Without telemetry the pipeline cannot verify difficulty claims, so it parks them on the watch list.
That costs the Magma Warden balance issue (missed, 15 balance messages labelled skill_issue) and
the Top-3 order (no players-lost signal: all priorities fall back to report counts). With telemetry,
both "impossible level" crowds (Thorn Canyon, Clocktower) are dismissed with numbers and the boss
buff is confirmed as balance.

## Failures (real, from the reports)

1. **B032 (held out)** — "Стелс на 2 миссии невозможный, охрана видит сквозь стены." ("Stealth in
   mission 2 is impossible, guards see through walls.") Labelled `bug`; truth is `skill_issue`.
   "See through walls" reads like a specific malfunction, so the message escaped the difficulty
   rule. A single message did not create a false-alarm issue (the group went to watch), but the
   message category is wrong.
2. **Community-only mode misses balance issues by design** — A-ISS-03 (Magma Warden) is on the watch
   list, not reported, because a "too hard" claim needs telemetry to verify.
3. **Wall jump on Thorn Canyon (A, planted false bug)** — one player, specific-sounding, normal
   telemetry. Correctly held on the watch list rather than reported; shown here because a
   keyword system reports it.

## Cost and latency (measured)

| Run | Messages | LLM calls | Cost | Wall clock |
|---|---|---|---|---|
| A, with telemetry (cold cache) | 180 | 14 | $0.3772 | 30.5 s |
| B, with telemetry (cold cache) | 66 | 8 | $0.1536 | 27.8 s |
| A, no telemetry (extraction cached, tickets new) | 180 | 4 (+9 cached) | $0.0408 | 8.8 s |

≈ **$0.21 per 100 messages** (A cold run). Cost is OpenRouter's reported `usage.cost`; list prices
from https://openrouter.ai/api/v1/models (Sonnet 5.5: $2 / 1M input, $10 / 1M output, 2026-10-09).

## Honesty notes

- The data is synthetic, written by the team with planted issues (see `eval/README.md`).
- True priority is defined by a telemetry formula: players who started the level on the new patch × drop in completion rate.
- No prompt tuning was done: `extract_v1` is the first version. B was run once.
- Automated tests: `bun test` (verify rule + answer-key guard).
