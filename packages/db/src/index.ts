import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";
export { schema };

const url = process.env.DATABASE_URL ?? "postgres://pp:pp@localhost:5433/playerpulse";
export const sql = postgres(url, { max: 10 });
export const db = drizzle(sql, { schema });
export type Db = typeof db;
