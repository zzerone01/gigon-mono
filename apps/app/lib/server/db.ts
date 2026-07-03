import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Supavisor transaction pooler (:6543) — no prepared statements, and keep
// the per-instance pool tiny (Fluid Compute reuses instances).
const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 2 });

export const db = drizzle(client, { schema });

export type Db = typeof db;
export type DbTx = Parameters<Parameters<Db["transaction"]>[0]>[0];
