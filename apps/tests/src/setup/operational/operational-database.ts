import * as schema from "@korex/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export function createOperationalDatabase(
  databaseUrl = requiredEnv("DATABASE_URL"),
) {
  const pool = new Pool({ connectionString: databaseUrl });
  const database = drizzle(pool, { schema });
  let closed = false;

  return {
    close: async () => {
      if (closed) {
        return;
      }

      closed = true;
      await pool.end();
    },
    database,
    pool,
  };
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for operational tests`);
  }

  return value;
}
