import {
  durableJobMaxRetryAttempts,
  getDurableJobFailureState,
} from "@korex/api/modules/durable-jobs/durable-job-policy";
import { describe, expect, it } from "vitest";

describe("durable job policy", () => {
  it("uses the configured retry attempt count", () => {
    expect(durableJobMaxRetryAttempts).toBe(3);
  });

  it("schedules failed jobs with short exponential backoff", () => {
    const now = new Date("2026-04-01T00:00:00.000Z");

    expect(
      getDurableJobFailureState({
        attemptCount: 0,
        error: "first",
        now,
      }),
    ).toMatchObject({
      attemptCount: 1,
      lastError: "first",
      lockedAt: null,
      lockedBy: null,
      runAfter: new Date("2026-04-01T00:00:01.000Z"),
      status: "failed",
      updatedAt: now,
    });
    expect(
      getDurableJobFailureState({
        attemptCount: 1,
        error: "second",
        now,
      }).runAfter,
    ).toEqual(new Date("2026-04-01T00:00:02.000Z"));
    expect(
      getDurableJobFailureState({
        attemptCount: 2,
        error: "third",
        now,
      }).runAfter,
    ).toEqual(new Date("2026-04-01T00:00:04.000Z"));
  });

  it("does not delay failures beyond the retry policy", () => {
    const now = new Date("2026-04-01T00:00:00.000Z");

    expect(
      getDurableJobFailureState({
        attemptCount: durableJobMaxRetryAttempts,
        error: "final",
        now,
      }),
    ).toMatchObject({
      attemptCount: 4,
      runAfter: now,
      status: "failed",
    });
  });
});
