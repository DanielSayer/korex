import { enqueueCompletedWeeklyTrainingSummaries } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary-jobs.repository";
import { runWeeklyTrainingSummaryWorkerOnce } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary-worker";
import {
  db,
  weeklyTrainingSummaries,
  weeklyTrainingSummaryGenerationJobs,
} from "@korex/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("weekly training summary worker", () => {
  it("enqueues eligible users for the completed training week and stores summaries with previous-week deltas", async () => {
    const userId = userDataExtensions.HughJass.id;

    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(1301)
        .withName("Previous Long Run")
        .withStartAt(new Date("2026-04-27T22:00:00.000Z"))
        .withDistanceMeters(5000)
        .withMovingTimeSeconds(1500)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1302)
        .withName("Easy Run")
        .withStartAt(new Date("2026-05-04T20:00:00.000Z"))
        .withDistanceMeters(3000)
        .withMovingTimeSeconds(1000)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1303)
        .withName("Long Run")
        .withStartAt(new Date("2026-05-09T21:00:00.000Z"))
        .withDistanceMeters(7000)
        .withMovingTimeSeconds(2000)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1304)
        .withName("Current Week Run")
        .withStartAt(new Date("2026-05-11T20:00:00.000Z"))
        .withDistanceMeters(20_000)
        .withMovingTimeSeconds(4000)
        .build(),
    ).seedAsync();

    const enqueueResult = await enqueueCompletedWeeklyTrainingSummaries({
      now: new Date("2026-05-15T02:00:00.000Z"),
    });
    const workerResult = await runWeeklyTrainingSummaryWorkerOnce({
      batchSize: 10,
      now: new Date("2026-05-15T02:01:00.000Z"),
      staleLockMs: 60_000,
      workerId: "worker-1",
    });

    const summaries = await db.select().from(weeklyTrainingSummaries);
    const jobs = await db.select().from(weeklyTrainingSummaryGenerationJobs);

    expect(enqueueResult).toEqual({
      enqueued: 1,
      weekEndAt: new Date("2026-05-10T14:00:00.000Z"),
      weekStartAt: new Date("2026-05-03T14:00:00.000Z"),
    });
    expect(workerResult).toEqual({ processed: 1 });
    expect(jobs).toEqual([
      expect.objectContaining({
        lockedAt: null,
        lockedBy: null,
        status: "succeeded",
        userId,
        weekStartAt: new Date("2026-05-03T14:00:00.000Z"),
      }),
    ]);
    expect(summaries).toEqual([
      expect.objectContaining({
        activityCount: 2,
        averageSpeedMetersPerSecond: 10_000 / 3000,
        longestActivityId: 1303,
        previousWeekActivityCountDelta: 1,
        previousWeekDistanceDeltaMeters: 5000,
        previousWeekMovingTimeDeltaSeconds: 1500,
        totalDistanceMeters: 10_000,
        totalMovingTimeSeconds: 3000,
        userId,
        weekEndAt: new Date("2026-05-10T14:00:00.000Z"),
        weekStartAt: new Date("2026-05-03T14:00:00.000Z"),
      }),
    ]);
    expect(summaries[0]?.payload).toMatchObject({
      highlights: {
        longestActivity: {
          id: 1303,
          name: "Long Run",
        },
      },
      previousWeek: {
        activityCount: 1,
        totalDistanceMeters: 5000,
        totalMovingTimeSeconds: 1500,
        weekStartAt: "2026-04-26T14:00:00.000Z",
      },
    });
  });

  it("does not enqueue a summary for a completed week without activities", async () => {
    const result = await enqueueCompletedWeeklyTrainingSummaries({
      now: new Date("2026-05-15T02:00:00.000Z"),
    });

    const jobs = await db.select().from(weeklyTrainingSummaryGenerationJobs);

    expect(result.enqueued).toBe(0);
    expect(jobs).toEqual([]);
  });

  it("replaces the existing summary when the same user and week are generated again", async () => {
    const userId = userDataExtensions.HughJass.id;
    const now = new Date("2026-05-15T02:00:00.000Z");

    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(1401)
        .withStartAt(new Date("2026-05-05T20:00:00.000Z"))
        .withDistanceMeters(1000)
        .withMovingTimeSeconds(500)
        .build(),
    ).seedAsync();
    await enqueueCompletedWeeklyTrainingSummaries({ now });
    await runWeeklyTrainingSummaryWorkerOnce({
      batchSize: 10,
      now,
      staleLockMs: 60_000,
      workerId: "worker-1",
    });

    await db
      .update(weeklyTrainingSummaries)
      .set({
        totalDistanceMeters: 1,
      })
      .where(eq(weeklyTrainingSummaries.userId, userId));
    await enqueueCompletedWeeklyTrainingSummaries({ now });
    await runWeeklyTrainingSummaryWorkerOnce({
      batchSize: 10,
      now: new Date("2026-05-15T02:01:00.000Z"),
      staleLockMs: 60_000,
      workerId: "worker-1",
    });

    const summaries = await db.select().from(weeklyTrainingSummaries);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      totalDistanceMeters: 1000,
      userId,
    });
  });

  it("does not re-enqueue a succeeded weekly summary during scheduled generation", async () => {
    const userId = userDataExtensions.HughJass.id;
    const now = new Date("2026-05-15T02:00:00.000Z");

    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(1501)
        .withStartAt(new Date("2026-05-05T20:00:00.000Z"))
        .withDistanceMeters(1000)
        .withMovingTimeSeconds(500)
        .build(),
    ).seedAsync();

    await enqueueCompletedWeeklyTrainingSummaries({ now });
    await runWeeklyTrainingSummaryWorkerOnce({
      batchSize: 10,
      now,
      staleLockMs: 60_000,
      workerId: "worker-1",
    });

    const enqueueResult = await enqueueCompletedWeeklyTrainingSummaries({
      now: new Date("2026-05-15T02:01:00.000Z"),
      skipSucceeded: true,
    });
    const workerResult = await runWeeklyTrainingSummaryWorkerOnce({
      batchSize: 10,
      now: new Date("2026-05-15T02:02:00.000Z"),
      staleLockMs: 60_000,
      workerId: "worker-1",
    });
    const jobs = await db.select().from(weeklyTrainingSummaryGenerationJobs);

    expect(enqueueResult.enqueued).toBe(0);
    expect(workerResult).toEqual({ processed: 0 });
    expect(jobs).toEqual([
      expect.objectContaining({
        status: "succeeded",
        userId,
      }),
    ]);
  });
});
