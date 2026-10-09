# Audit of the previous concept (GoBuster, GameTECH hackathon)

Read-only review of the team's earlier codebase (`team-enthuzone-main`). Nothing in this repository
was copied from it. We used it to learn what was attempted and what to change.

## What it was

GoBuster: Next.js 16 dashboard + Express/MongoDB server (JWT auth, multi-tenant) + a separate
Gemini 2.5 Flash "ai-service" + a Discord relay bot + a Unity game with a `TelemetrySender.cs`.
Five services, two databases-worth of setup, needs Mongo, Discord and Gemini keys to run anything.

## Components

| Old component | Exists? | Works? | Quality (1–5) | Maps to | Decision |
|---|---|---|---|---|---|
| Discord ingestion (bot relay, queue, backoff) | yes | needs live bot + server | 3 | F1 | ignore — roadmap only |
| CSV / Steam ingestion | no | — | — | F1, F12 | build fresh |
| LLM filtering (Gemini, JSON output) | yes | needs key | 3 | F2 | learn-from: structured output idea |
| Correlation engine (completion-rate gate) | yes | yes | 2 | F4 | **replace** — rule was wrong (see below) |
| Unity telemetry sender | yes | yes | 3 | — | ignore — test pack provides telemetry |
| Ticket output | partial (issue clusters) | partial | 2 | F6 | build fresh |
| Dashboard UI (1,863-line single component, recharts) | yes | needs server | 2 | F8 | learn-from: layout ideas; rewrite with shadcn |
| Auth / orgs / RBAC / audit log | yes | yes | 3 | — | ignore — no login needed |
| Deployment (Dockerfiles) | yes | multi-service | 2 | F9 | replace with one Vercel app |
| Tests | server unit + integration | yes | 3 | F14 | build fresh around the verify rule |

## Gaps (P0 features with nothing in the old code)

Multilingual level-name mapping against a level list, sarcasm handling, difficulty-vs-bug split,
dismissal with proof, players-lost prioritisation, evaluation against baselines, cost meter.

## Design flaws fixed

1. **"If completion is normal, ignore the complaint."** Wrong: it silences real bugs that don't
   move completion (cosmetic text overlap, controls). New rule: telemetry never silences a
   technical bug; it only settles difficulty arguments.
2. **Step order** "Prove before Verify" was inconsistent. New order: Listen → Verify → Prioritise → Ticket.
3. **Keyword/regex filtering** replaced with LLM structured extraction.
4. **Hard-coded ROI numbers** ($350K, $120K, 30%, 10x) were unsourced. None appear here; every
   number comes from a reproducible run.
5. A `.env` file was committed in the old dashboard. Here every `.env*` is git-ignored.

## Stack decision

The old stack choice (Next.js + Tailwind) gets us a deployable UI fastest on Vercel, and lets us use
shadcn/ui. We keep the choice, drop everything else: one Next.js app, a TypeScript pipeline, no
database, no auth, an LLM via OpenRouter, pre-computed demo results committed to the repo.
