import { env } from "@korex/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export function createDb(databaseUrl = env.DATABASE_URL) {
  return drizzle(databaseUrl, { schema });
}

export type Database = ReturnType<typeof createDb>;

export function createDatabaseResources(databaseUrl = env.DATABASE_URL) {
  const database = createDb(databaseUrl);

  return {
    database,
    pool: database.$client,
  };
}

const databaseResources = createDatabaseResources();

export const db = databaseResources.database;
export const pool = databaseResources.pool;

export * from "./schema";
