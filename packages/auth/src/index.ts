import { type Database, db } from "@korex/db";
import * as schema from "@korex/db/schema/auth";
import { env } from "@korex/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function createAuth({ database }: { database: Database }) {
  return betterAuth({
    database: drizzleAdapter(database, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [],
  });
}

export type Auth = ReturnType<typeof createAuth>;

export const auth = createAuth({ database: db });
