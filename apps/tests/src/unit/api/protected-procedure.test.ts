import { protectedProcedure } from "@korex/api";
import type { Context } from "@korex/api/context";
import { createRouterClient } from "@orpc/server";
import { describe, expect, it } from "vitest";

describe("protected procedure", () => {
  it("rejects requests without an authenticated user", async () => {
    const client = createRouterClient(
      {
        probe: protectedProcedure.handler(() => "allowed"),
      },
      {
        context: {
          auth: null,
          session: null,
        },
      },
    );

    await expect(client.probe()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("passes the authenticated session to the handler", async () => {
    const client = createRouterClient(
      {
        probe: protectedProcedure.handler(
          ({ context }) => context.session.user.id,
        ),
      },
      {
        context: {
          auth: null,
          session: {
            user: { id: "user-1" },
          } as Context["session"],
        },
      },
    );

    await expect(client.probe()).resolves.toBe("user-1");
  });
});
