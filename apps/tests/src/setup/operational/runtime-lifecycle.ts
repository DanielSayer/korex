import { setTimeout as delay } from "node:timers/promises";

export async function waitForRuntimeState<T>({
  expected,
  getState,
  timeoutMs = 2_000,
}: {
  expected: T;
  getState: () => T;
  timeoutMs?: number;
}) {
  const startedAt = Date.now();

  while (getState() !== expected) {
    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error(
        `Timed out waiting for runtime state: ${String(expected)}`,
      );
    }

    await delay(10);
  }
}
