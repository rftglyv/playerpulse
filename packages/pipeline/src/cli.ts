// bun packages/pipeline/src/cli.ts --scenario eval/data/scenario_A --telemetry on --out out/pp_A.json [--model id]
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadScenarioDir } from "./ingest";
import { runPipeline } from "./run";

const args = Object.fromEntries(
  process.argv.slice(2).reduce<[string, string][]>((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1] ?? ""]);
    return acc;
  }, []),
);
if (!args.scenario || !args.out) {
  console.error("usage: --scenario <dir> --out <file> [--telemetry on|off] [--model id] [--tickets on|off]");
  process.exit(1);
}
if (args.scenario.includes("answer_key")) throw new Error("the pipeline never reads the answer key");

const scenario = loadScenarioDir(args.scenario, args.telemetry !== "off");
const result = await runPipeline(scenario, { model: args.model || undefined, tickets: args.tickets !== "off" });
mkdirSync(dirname(args.out), { recursive: true });
writeFileSync(args.out, JSON.stringify(result, null, 2));
const reported = result.issues.filter((i) => i.status === "reported");
console.log(
  `${result.system} · ${result.model} · ${result.messages.length} msgs · ${reported.length} reported, ` +
    `${result.issues.filter((i) => i.status === "dismissed").length} dismissed, ${result.issues.filter((i) => i.status === "watch").length} watch · ` +
    `$${result.meta.cost_usd} · ${result.meta.seconds}s · ${result.meta.llm_calls} calls (${result.meta.cache_hits} cached) → ${args.out}`,
);
for (const i of reported) console.log(`  #${i.priority} [${i.category}] L${i.level} ${i.title} — lost ${i.players_lost_estimate}`);
