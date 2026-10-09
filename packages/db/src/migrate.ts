import { migrate } from "drizzle-orm/postgres-js/migrator";
import { join } from "node:path";
import { db, sql } from "./index";

await migrate(db, { migrationsFolder: join(import.meta.dir, "..", "drizzle") });
console.log("migrations applied");
await sql.end();
