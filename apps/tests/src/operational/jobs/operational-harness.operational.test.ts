import { createControllableClock } from "../../setup/operational/controllable-clock";
import { createHandlerGate } from "../../setup/operational/handler-gate";
import { createOperationalDatabase } from "../../setup/operational/operational-database";
import { waitForRuntimeState } from "../../setup/operational/runtime-lifecycle";

describe("operational Postgres harness", () => {
  it("creates an independently owned Pool and Drizzle database", async () => {
    const operationalDatabase = createOperationalDatabase();

    try {
      const result = await operationalDatabase.pool.query<{ value: number }>(
        "select 1::int as value",
      );

      expect(result.rows).toEqual([{ value: 1 }]);
    } finally {
      await operationalDatabase.close();
    }
  });

  it("holds a handler until the test releases it", async () => {
    const gate = createHandlerGate();
    const handler = gate.wait();

    await gate.waitUntilEntered();
    expect(gate.isWaiting()).toBe(true);

    gate.release();
    await handler;

    expect(gate.isWaiting()).toBe(false);
  });

  it("advances time without waiting on wall-clock time", () => {
    const clock = createControllableClock(new Date("2026-07-14T00:00:00.000Z"));

    clock.advanceBy(90_000);

    expect(clock.now()).toEqual(new Date("2026-07-14T00:01:30.000Z"));
  });

  it("waits for an observable runtime lifecycle state", async () => {
    let state = "starting";
    const ready = waitForRuntimeState({
      expected: "ready",
      getState: () => state,
    });

    state = "ready";

    await expect(ready).resolves.toBeUndefined();
  });
});
