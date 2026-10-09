# Disclosure

- **Prior concept:** Concept first explored by the same team at a previous hackathon (GameTECH).
  All code in this repository was written during this hackathon. See `AUDIT.md`.
- **Models:** `anthropic/claude-sonnet-5.5` via OpenRouter for every reported run (temperature 0).
  The model ID is also written into every output file (`"model"`). The UI can switch to
  `anthropic/claude-haiku-5.5`, `google/gemini-3.8-flash` or `openai/gpt-5.6-luna`; no results are reported for those.
- **Templates:** `create-next-app` (Next.js), `shadcn/ui` components (copied in by its CLI).
- **Libraries:** Next.js, React, Tailwind CSS, shadcn/ui, Base UI, Recharts, lucide-react, Elysia,
  @elysiajs/openapi, Zod, Drizzle ORM, postgres.js, Turborepo, anime.js (landing motion).
  Exact versions in `package.json` / `bun.lock`.
- **Datasets:** `eval/` test pack — synthetic data (two fictional games) and the evaluation script,
  generated with Claude (Anthropic) during the hackathon. Planted issues and labels are in
  `eval/answer_key/`. **The app does not read the answer key** (enforced by a test).
- **AI coding assistance:** Claude Code was used while writing this repository.
- **Price source:** https://openrouter.ai/api/v1/models (read 2026-10-09): Sonnet 5.5 at $2 / 1M input
  and $10 / 1M output tokens. Run costs in `TESTING.md` are OpenRouter's reported `usage.cost`.
- **Monorepo conventions** (folder layout, shared tsconfig/schema packages) follow the team's own earlier
  project "routly" as a pattern; no code was copied from it.
