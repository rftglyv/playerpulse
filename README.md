# PlayerPulse

**Telemetry knows where. Players know why. PlayerPulse settles it.**

PlayerPulse turns noisy player complaints (Discord, Steam reviews, in-game feedback — Azerbaijani,
Russian, English and mixed) plus gameplay telemetry into verified, prioritised, ready-to-fix issues.
Loud "this level is impossible" complaints get dismissed with proof when telemetry shows nothing changed;
real bugs are never silenced, only ranked.

Built at the hackathon by team EnthuZone (AI Gaming track). See `AUDIT.md` and `DISCLOSURE.md`.

## Results (synthetic test pack, see `TESTING.md`)

| | Issues found | False alarms | Message accuracy | "Too hard" wrongly flagged |
|---|---|---|---|---|
| Best baseline, scenario A test | 5/5 (keyword) | 2 | 59% | 16/23 |
| **PlayerPulse, scenario A test** | **5/5** | **0** | **100%** | **0/23** |
| **PlayerPulse, scenario B held out** | **4/4** | **0** | **98%** | **1/15** |

≈ $0.21 per 100 messages, ~30 s per run (`anthropic/claude-sonnet-5.5` via OpenRouter).

## Layout

```
apps/api        Elysia + Zod API (runs, issues, tasks), OpenAPI at /api/docs
apps/web        Next.js + shadcn dashboard
packages/pipeline  extraction → grouping → verification → priority → tickets
packages/db     Postgres + Drizzle schema and migrations
packages/api-schemas  shared Zod contracts
eval/           test pack + evaluate.py (the app never reads eval/answer_key)
demo/           precomputed runs, auto-loaded into an empty database
```

## Run locally

```bash
cp .env.example .env          # DATABASE_URL, OPENROUTER_API_KEY
bun install && bun run --filter @playerpulse/db db:migrate
bun run dev                   # web :3000, api :4000
```

Seed test accounts with data: `bun run db:seed` (creates `test@playerpulse.app` / `playerpulse-test` and
`judge@playerpulse.app` / `playerpulse-judge`, each with its own copy of the evaluated runs; override with `SEED_USERS`).

Deploy: `docker network create dokploy-network` once (Dokploy already has it), then `docker compose up -d --build`
(api + web; Postgres is external via `DATABASE_URL`; web is reached through the proxy on dokploy-network,
no host port is published), then once:
`docker compose exec api bun apps/api/scripts/seed.ts`.

## Reproduce the evaluation

```bash
bun run pipeline --scenario eval/data/scenario_A --telemetry on --out out/pp_A.json
cd eval && python3 evaluate.py --scenario A --pred ../out/pp_A.json
```
