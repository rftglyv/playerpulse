// Seed test accounts, each with its own copy of the evaluated runs (demo/*.json).
//   bun --env-file=../../.env scripts/seed.ts            (from apps/api)
//   SEED_USERS="Name:email:password;Name2:email2:password2" overrides the defaults.
// Idempotent: existing users are reused, runs they already have are skipped.
import { db, user } from "@playerpulse/db";
import { eq } from "drizzle-orm";
import { auth } from "../src/auth";
import { seedRunsFor } from "../src/service";

const DEFAULT_USERS = "Test Studio:test@playerpulse.app:playerpulse-test;Judge:judge@playerpulse.app:playerpulse-judge";

const accounts = (process.env.SEED_USERS ?? DEFAULT_USERS)
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => {
    const [name, email, password] = s.split(":");
    if (!name || !email || !password || password.length < 8) throw new Error(`bad SEED_USERS entry: ${s}`);
    return { name, email, password };
  });

for (const a of accounts) {
  let [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, a.email));
  if (!row) {
    const res = await auth.api.signUpEmail({ body: a });
    row = { id: res.user.id };
    console.log(`created ${a.email}`);
  } else {
    console.log(`exists  ${a.email}`);
  }
  const added = await seedRunsFor(row.id);
  console.log(`        ${added} run(s) added`);
}
process.exit(0);
