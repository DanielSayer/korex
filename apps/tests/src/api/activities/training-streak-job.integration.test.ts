import { trainingStreakJobModule } from "@korex/api/modules/activities/training-streaks/training-streak-job";
import { db, trainingStreaks } from "@korex/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("training streak job", () => {
  it("starts a streak for a qualifying week", async () => {
    const streak = await processJob({
      hasQualifyingActivity: true,
      streak: null,
      weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });

    expect(streak).toMatchObject({
      currentStreak: 1,
      lastQualifiedWeekStartAt: new Date("2026-05-10T14:00:00.000Z"),
      maxStreak: 1,
      userId: userDataExtensions.HughJass.id,
    });
  });

  it("increments and updates max streak for the next qualifying week", async () => {
    const streak = await processJob({
      hasQualifyingActivity: true,
      streak: {
        currentStreak: 2,
        lastQualifiedWeekStartAt: new Date("2026-05-03T14:00:00.000Z"),
        maxStreak: 2,
      },
      weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });

    expect(streak).toMatchObject({
      currentStreak: 3,
      lastQualifiedWeekStartAt: new Date("2026-05-10T14:00:00.000Z"),
      maxStreak: 3,
    });
  });

  it("does not increment twice for the same qualifying week", async () => {
    const streak = await processJob({
      hasQualifyingActivity: true,
      streak: {
        currentStreak: 3,
        lastQualifiedWeekStartAt: new Date("2026-05-10T14:00:00.000Z"),
        maxStreak: 3,
      },
      weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });

    expect(streak).toMatchObject({
      currentStreak: 3,
      lastQualifiedWeekStartAt: new Date("2026-05-10T14:00:00.000Z"),
      maxStreak: 3,
    });
  });

  it("resets current streak for a completed week with no qualifying activity", async () => {
    const streak = await processJob({
      hasQualifyingActivity: false,
      streak: {
        currentStreak: 4,
        lastQualifiedWeekStartAt: new Date("2026-05-03T14:00:00.000Z"),
        maxStreak: 5,
      },
      weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });

    expect(streak).toMatchObject({
      currentStreak: 0,
      lastQualifiedWeekStartAt: null,
      maxStreak: 5,
    });
  });

  it("ignores stale jobs for weeks before the latest qualified week", async () => {
    const streak = await processJob({
      hasQualifyingActivity: false,
      streak: {
        currentStreak: 5,
        lastQualifiedWeekStartAt: new Date("2026-05-17T14:00:00.000Z"),
        maxStreak: 5,
      },
      weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });

    expect(streak).toMatchObject({
      currentStreak: 5,
      lastQualifiedWeekStartAt: new Date("2026-05-17T14:00:00.000Z"),
      maxStreak: 5,
    });
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
  const userId = userDataExtensions.HughJass.id;

  if (streak) {
    await db.insert(trainingStreaks).values({ ...streak, userId });
  }

  if (hasQualifyingActivity) {
    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(1701)
        .withStartAt(new Date(weekStartAt.getTime() + 24 * 60 * 60 * 1000))
        .build(),
    ).seedAsync();
  }

  await trainingStreakJobModule.handler(
    { userId, weekStartAt: weekStartAt.toISOString() },
    {
      database: db,
      jobId: "training-streak-job",
      signal: new AbortController().signal,
    },
  );

  const [result] = await db
    .select()
    .from(trainingStreaks)
    .where(eq(trainingStreaks.userId, userId));

  return result;
}
