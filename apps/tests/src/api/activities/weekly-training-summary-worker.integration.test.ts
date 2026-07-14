import { weeklyTrainingSummaryJobModule } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary-job";
import { enqueueWeeklyTrainingSummaryGeneration } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary-jobs.repository";
import { weeklyTrainingSummaryScheduleJobModule } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary-schedule-job";
import { enqueueCompletedWeeklyTrainingSummaries } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary-scheduler.service";
import {
  createJobRuntime,
  inspectJob,
} from "@korex/api/modules/job-runtime/job-runtime";
import { db, jobRuntimeJobs, weeklyTrainingSummaries } from "@korex/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { runWeeklyTrainingSummarySchedulerOnce } from "../../../../worker/src/weekly-training-summary-scheduler";
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
    const [job] = await listGenerationJobs();
    await processJob(requiredJobId(job));

    const summaries = await db.select().from(weeklyTrainingSummaries);

    expect(enqueueResult).toEqual({
      enqueued: 1,
      weekEndAt: new Date("2026-05-10T14:00:00.000Z"),
      weekStartAt: new Date("2026-05-03T14:00:00.000Z"),
    });
    await expect(inspectJob({ id: requiredJobId(job) })).resolves.toMatchObject(
      {
        state: "succeeded",
      },
    );
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

    expect(result.enqueued).toBe(0);
    await expect(listGenerationJobs()).resolves.toEqual([]);
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
    const [firstJob] = await listGenerationJobs();
    await processJob(requiredJobId(firstJob));

    await db
      .update(weeklyTrainingSummaries)
      .set({ totalDistanceMeters: 1 })
      .where(eq(weeklyTrainingSummaries.userId, userId));
    await enqueueCompletedWeeklyTrainingSummaries({ now });
    const secondJob = (await listGenerationJobs()).find(
      (job) => job.state === "queued",
    );
    await processJob(requiredJobId(secondJob));

    const summaries = await db.select().from(weeklyTrainingSummaries);
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      totalDistanceMeters: 1000,
      userId,
    });
  });

  it("does not re-enqueue an existing weekly summary during scheduled generation", async () => {
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
    const [job] = await listGenerationJobs();
    await processJob(requiredJobId(job));

    const enqueueResult = await enqueueCompletedWeeklyTrainingSummaries({
      now: new Date("2026-05-15T02:01:00.000Z"),
      skipSucceeded: true,
    });

    expect(enqueueResult.enqueued).toBe(0);
    await expect(listGenerationJobs()).resolves.toHaveLength(1);
  });

  it("queues a new job when regeneration is requested", async () => {
    const userId = userDataExtensions.HughJass.id;
    const weekStartAt = new Date("2026-05-03T14:00:00.000Z");

    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(1601)
        .withStartAt(new Date("2026-05-05T20:00:00.000Z"))
        .withDistanceMeters(1000)
        .withMovingTimeSeconds(500)
        .build(),
    ).seedAsync();

    const firstJob = await enqueueWeeklyTrainingSummaryGeneration({
      userId,
      weekStartAt,
    });
    await processJob(firstJob.id);
    const secondJob = await enqueueWeeklyTrainingSummaryGeneration({
      userId,
      weekStartAt,
    });

    await expect(inspectJob({ id: secondJob.id })).resolves.toMatchObject({
      attemptCount: 0,
      finishedAt: null,
      key: `${userId}:${weekStartAt.toISOString()}`,
      lastError: null,
      state: "queued",
    });
    await expect(listGenerationJobs()).resolves.toHaveLength(2);
  });

  it("stores one recurring schedule occurrence for a completed week", async () => {
    const now = new Date("2026-05-17T20:00:00.000Z");

    await runWeeklyTrainingSummarySchedulerOnce({ now });
    await runWeeklyTrainingSummarySchedulerOnce({ now });

    const scheduleJobs = await db
      .select({
        payload: jobRuntimeJobs.payload,
        scheduleKey: jobRuntimeJobs.scheduleKey,
      })
      .from(jobRuntimeJobs)
      .where(
        eq(jobRuntimeJobs.name, weeklyTrainingSummaryScheduleJobModule.name),
      );

    expect(scheduleJobs).toEqual([
      {
        payload: { weekStartAt: "2026-05-10T14:00:00.000Z" },
        scheduleKey: "2026-05-10T14:00:00.000Z",
      },
    ]);
  });
});

async function listGenerationJobs() {
  return db
    .select({ id: jobRuntimeJobs.id, state: jobRuntimeJobs.state })
    .from(jobRuntimeJobs)
    .where(eq(jobRuntimeJobs.name, weeklyTrainingSummaryJobModule.name));
}

async function processJob(jobId: string) {
  const runtime = createJobRuntime({
    databaseUrl: requiredDatabaseUrl(),
    pollIntervalMs: 5,
    tasks: {
      [weeklyTrainingSummaryJobModule.name]:
        weeklyTrainingSummaryJobModule.handler,
    },
    workerId: `weekly-summary-${jobId}`,
  });

  try {
    await runtime.start();
    await expect
      .poll(async () => (await inspectJob({ id: jobId }))?.state)
      .toBe("succeeded");
  } finally {
    await runtime.stop();
  }
}

function requiredJobId(job: { id: string } | undefined) {
  if (!job) {
    throw new Error("Expected a weekly summary job");
  }

  return job.id;
}

function requiredDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for integration tests");
  }

  return databaseUrl;
}
