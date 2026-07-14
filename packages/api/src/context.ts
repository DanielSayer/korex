import type { Auth } from "@korex/auth";
import type { Context as HonoContext } from "hono";

export type SessionAuth = {
  api: {
    getSession: (
      options: Parameters<Auth["api"]["getSession"]>[0],
    ) => ReturnType<Auth["api"]["getSession"]>;
  };
};

export type CreateContextOptions = {
  auth: SessionAuth;
  context: HonoContext;
};

export async function createContext({ auth, context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    auth: null,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
