import { createTrainingStreakJobModule } from "@korex/api/modules/activities/training-streaks/training-streak-job";
import { db } from "@korex/db";
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
  } = {
    streaks: [],
  };

  const module = createTrainingStreakJobModule({
    getInputs: async () => ({
      hasQualifyingActivity,
      streak: streak
        ? {
            ...streak,
            updatedAt: new Date("2026-05-21T00:00:00.000Z"),
            userId: "user-1",
          }
        : null,
    }),
    upsertStreak: async (input) => {
      writes.streaks.push(input);
    },
  });

  await module.handler(
    { userId: "user-1", weekStartAt: weekStartAt.toISOString() },
    {
      database: db,
      jobId: "training-streak-job",
      signal: new AbortController().signal,
    },
  );

  return writes;
}
