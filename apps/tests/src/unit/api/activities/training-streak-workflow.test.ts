import {
  TrainingStreakJobRepository,
  TrainingStreakRepository,
} from "@korex/api/modules/activities/training-streaks/training-streak-workflow.dependencies";
import { TrainingStreakWorkflowLayer } from "@korex/api/modules/activities/training-streaks/training-streak-workflow.live";
import { processTrainingStreakUpdateJob } from "@korex/api/modules/activities/training-streaks/training-streak-workflow.service";
import { TimeProvider } from "@korex/api/modules/time-provider.dependencies";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

describe("training streak workflow", () => {
  it("starts a streak for a qualifying week", async () => {
    const writes = await processJob({
      hasQualifyingActivity: true,
      streak: null,
      weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });

    expect(writes.streaks).toEqual([
      {
        currentStreak: 1,
        lastQualifiedWeekStartAt: new Date("2026-05-10T14:00:00.000Z"),
        maxStreak: 1,
        userId: "user-1",
      },
    ]);
  });

  it("increments and updates max streak for the next qualifying week", async () => {
    const writes = await processJob({
      hasQualifyingActivity: true,
      streak: {
        currentStreak: 2,
        lastQualifiedWeekStartAt: new Date("2026-05-03T14:00:00.000Z"),
        maxStreak: 2,
      },
      weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });

    expect(writes.streaks).toEqual([
      {
        currentStreak: 3,
        lastQualifiedWeekStartAt: new Date("2026-05-10T14:00:00.000Z"),
        maxStreak: 3,
        userId: "user-1",
      },
    ]);
  });

  it("does not increment twice for the same qualifying week", async () => {
    const writes = await processJob({
      hasQualifyingActivity: true,
      streak: {
        currentStreak: 3,
        lastQualifiedWeekStartAt: new Date("2026-05-10T14:00:00.000Z"),
        maxStreak: 3,
      },
      weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });

    expect(writes.streaks).toEqual([]);
  });

  it("resets current streak for a completed week with no qualifying activity", async () => {
    const writes = await processJob({
      hasQualifyingActivity: false,
      streak: {
        currentStreak: 4,
        lastQualifiedWeekStartAt: new Date("2026-05-03T14:00:00.000Z"),
        maxStreak: 5,
      },
      weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });

    expect(writes.streaks).toEqual([
      {
        currentStreak: 0,
        lastQualifiedWeekStartAt: null,
        maxStreak: 5,
        userId: "user-1",
      },
    ]);
  });

  it("ignores stale jobs for weeks before the latest qualified week", async () => {
    const writes = await processJob({
      hasQualifyingActivity: false,
      streak: {
        currentStreak: 5,
        lastQualifiedWeekStartAt: new Date("2026-05-17T14:00:00.000Z"),
        maxStreak: 5,
      },
      weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });

    expect(writes.streaks).toEqual([]);
  });
});

type ExistingStreak = {
  currentStreak: number;
  lastQualifiedWeekStartAt: Date | null;
  maxStreak: number;
};

async function processJob({
  hasQualifyingActivity,
  streak,
  weekStartAt,
}: {
  hasQualifyingActivity: boolean;
  streak: ExistingStreak | null;
  weekStartAt: Date;
}) {
  const writes: {
    streaks: Array<ExistingStreak & { userId: string }>;
    succeededJobs: number[];
  } = {
    streaks: [],
    succeededJobs: [],
  };

  const layer = TrainingStreakWorkflowLayer.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(TimeProvider, {
          now: () => new Date("2026-05-22T00:00:00.000Z"),
        }),
        Layer.succeed(TrainingStreakRepository, {
          getTrainingStreakProjectionInputs: async () => ({
            hasQualifyingActivity,
            streak: streak
              ? {
                  ...streak,
                  updatedAt: new Date("2026-05-21T00:00:00.000Z"),
                  userId: "user-1",
                }
              : null,
          }),
          upsertTrainingStreak: async (input) => {
            writes.streaks.push(input);
          },
        }),
        Layer.succeed(TrainingStreakJobRepository, {
          claimTrainingStreakUpdateJobs: async () => [],
          markTrainingStreakUpdateFailed: async () => {},
          markTrainingStreakUpdateSucceeded: async ({ jobId }) => {
            writes.succeededJobs.push(jobId);
          },
        }),
      ),
    ),
  );

  await Effect.runPromise(
    processTrainingStreakUpdateJob({
      attemptCount: 0,
      id: 123,
      userId: "user-1",
      weekStartAt,
    }).pipe(Effect.provide(layer)),
  );

  expect(writes.succeededJobs).toEqual([123]);

  return writes;
}
