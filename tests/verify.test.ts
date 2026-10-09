import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadScenarioDir, levelDelta, playersLost, verifyGroup } from "../packages/pipeline/src";

const A = loadScenarioDir("eval/data/scenario_A");
const d = (level: number) => levelDelta(A.telemetry, level, "1.3", "1.4");
const g = (kind: "technical_bug" | "difficulty_claim", n: number) => ({ kind, authors: new Set(Array.from({ length: n }, (_, i) => `p${i}`)) });

describe("verify rule", () => {
  test("Twin Bridges collision bug is reported and ranks by players lost", () => {
    expect(verifyGroup(g("technical_bug", 5), d(4), true).status).toBe("reported");
    expect(playersLost(d(4))).toBeGreaterThan(2000);
  });
  test("Thorn Canyon 'impossible' complaints are dismissed with numbers", () => {
    const v = verifyGroup(g("difficulty_claim", 22), d(3), true);
    expect(v.status).toBe("dismissed");
    expect(v.evidence).toContain("completion");
  });
  test("Magma Warden difficulty is confirmed balance", () => {
    expect(verifyGroup(g("difficulty_claim", 8), d(6), true)).toMatchObject({ status: "reported", category: "balance" });
  });
  test("a technical bug is never dismissed because telemetry is normal", () => {
    expect(verifyGroup(g("technical_bug", 3), d(9), true).status).toBe("reported");
  });
  test("single report with no signal goes to watch", () => {
    expect(verifyGroup(g("technical_bug", 1), d(3), true).status).toBe("watch");
  });
  test("community-only mode never dismisses difficulty claims", () => {
    expect(verifyGroup(g("difficulty_claim", 22), null, false).status).toBe("watch");
  });
});

test("answer-key guard: app code never references the answer key", () => {
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      if (f === "node_modules" || f.startsWith(".")) continue;
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx|js)$/.test(f) && readFileSync(p, "utf8").includes("answer_key") && !p.endsWith("cli.ts")) hits.push(p);
    }
  };
  for (const dir of ["apps", "packages"]) walk(dir);
  expect(hits).toEqual([]);
});
