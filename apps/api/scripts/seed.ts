// Seed test accounts, each with its own copy of the evaluated runs (demo/*.json).
//
//   bun run db:seed                                        default accounts (or SEED_USERS from .env)
//   bun run db:seed -- --email a@b.co --password secret123 --name "QA Lead"    one specific account
//   bun run db:seed -- --email a@b.co --password secret123 --no-runs          account without data
//
// SEED_USERS="Name:email:password;Name2:email2:password2" overrides the defaults.
// Idempotent: existing users are reused (password unchanged), runs they already have are skipped.
import { db, user } from "@playerpulse/db";
import { eq } from "drizzle-orm";
import { auth } from "../src/auth";
import { seedRunsFor } from "../src/service";

const DEFAULT_USERS = "Test Studio:test@playerpulse.app:playerpulse-test;Judge:judge@playerpulse.app:playerpulse-judge";

type Account = { name: string; email: string; password: string };

function arg(flag: string) {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function accounts(): Account[] {
  const email = arg("--email");
  if (email) {
    const password = arg("--password");
    if (!password || password.length < 8) throw new Error("--password is required (min 8 characters)");
    return [{ name: arg("--name") ?? email.split("@")[0], email, password }];
  }
  const list = process.env.SEED_USERS?.trim() || DEFAULT_USERS;
  return list
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [name, mail, password] = s.split(":");
      if (!name || !mail || !password || password.length < 8) throw new Error(`bad SEED_USERS entry: ${s}`);
      return { name, email: mail, password };
    });
}

const withRuns = !process.argv.includes("--no-runs");

for (const a of accounts()) {
  let [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, a.email));
  if (!row) {
    const res = await auth.api.signUpEmail({ body: a });
    row = { id: res.user.id };
    console.log(`created  ${a.email}  /  ${a.password}`);
  } else {
    console.log(`exists   ${a.email}  (password unchanged)`);
  }
  if (withRuns) console.log(`         ${await seedRunsFor(row.id)} run(s) added`);
}
process.exit(0);
