import { describe, expect, it } from "vitest";
import { createServerRuntime } from "../../../../server/src/runtime";

describe("server runtime", () => {
  it("closes the listener before the process pool", async () => {
    const events: string[] = [];
    const runtime = createServerRuntime({
      fetch: () => new Response("OK"),
      hostname: "127.0.0.1",
      listen: async () => {
        events.push("listen");

        return {
          close: async () => {
            events.push("listener.close");
          },
        };
      },
      pool: {
        end: async () => {
          events.push("pool.end");
        },
      },
      port: 3000,
    });

    await runtime.start();
    await runtime.stop();

    expect(events).toEqual(["listen", "listener.close", "pool.end"]);
  });

  it("cleans the pool after startup failure and remains safe to stop", async () => {
    const startupError = new Error("listen failed");
    let poolEndCount = 0;
    const runtime = createServerRuntime({
      fetch: () => new Response("OK"),
      hostname: "127.0.0.1",
      listen: async () => {
        throw startupError;
      },
      pool: {
        end: async () => {
          poolEndCount += 1;
        },
      },
      port: 3000,
    });

    await expect(runtime.start()).rejects.toBe(startupError);
    await expect(runtime.stop()).resolves.toBeUndefined();

    expect(poolEndCount).toBe(1);
  });

  it("shares one idempotent shutdown across concurrent callers", async () => {
    let listenerCloseCount = 0;
    let poolEndCount = 0;
    const runtime = createServerRuntime({
      fetch: () => new Response("OK"),
      hostname: "127.0.0.1",
      listen: async () => ({
        close: async () => {
          listenerCloseCount += 1;
        },
      }),
      pool: {
        end: async () => {
          poolEndCount += 1;
        },
      },
      port: 3000,
    });

    await runtime.start();
    const firstStop = runtime.stop();
    const secondStop = runtime.stop();

    expect(secondStop).toBe(firstStop);
    await Promise.all([firstStop, secondStop]);
    expect(listenerCloseCount).toBe(1);
    expect(poolEndCount).toBe(1);
  });
});
