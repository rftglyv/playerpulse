# Disclosure

- **Prior concept:** Concept first explored by the same team at a previous hackathon (GameTECH).
  All code in this repository was written during this hackathon. See `AUDIT.md`.
- **Models:** accessed through OpenRouter. Exact model ID used for each run is written into every
  output file (`"model"`) and listed in `TESTING.md`.
- **Templates:** `create-next-app` (Next.js), `shadcn/ui` components (copied in by its CLI).
- **Libraries:** Next.js, React, Tailwind CSS, shadcn/ui, Radix UI, Recharts, lucide-react, zod.
  Exact versions in `package.json` / `bun.lock`.
- **Datasets:** `eval/` test pack — synthetic data (two fictional games) and the evaluation script,
  generated with Claude (Anthropic) during the hackathon. Planted issues and labels are in
  `eval/answer_key/`. **The app does not read the answer key** (enforced by a test).
- **AI coding assistance:** Claude Code was used while writing this repository.
- **Price source:** OpenRouter model pricing page — filled in with the run's cost in `TESTING.md`.
