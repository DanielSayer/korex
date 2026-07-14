import { describe, expect, it } from "vitest";
import { createServerApp } from "../../../../server/src/app";

describe("server app", () => {
  it("can be constructed and handle a request without starting a listener", async () => {
    const response = await createServerApp({ auth: createTestAuth() }).request(
      "/",
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("OK");
  });

  it("uses the auth owned by the process", async () => {
    const app = createServerApp({
      auth: {
        ...createTestAuth(),
        handler: async () => new Response("owned auth"),
      },
    });

    const response = await app.request("/api/auth/session");

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("owned auth");
  });
});

function createTestAuth() {
  return {
    api: {
      getSession: async () => null,
    },
    handler: async () => new Response(null, { status: 404 }),
  };
}
