import { replaceActivityStreams } from "@korex/api/modules/activities/artifacts/activity-artifacts.repository";
import { activityBestEffortJobModule } from "@korex/api/modules/activities/best-efforts/activity-best-effort-job";
import { enqueueActivityBestEffortCalculation } from "@korex/api/modules/activities/best-efforts/activity-best-effort-jobs.repository";
import {
  createJobRuntime,
  inspectJob,
} from "@korex/api/modules/job-runtime/job-runtime";
import {
  activities,
  activityBestEfforts,
  db,
  personalBestEfforts,
} from "@korex/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity best effort workflow", () => {
  it("replaces activity best efforts and refreshes personal bests when the best changes or disappears", async () => {
    const slowerActivity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withId(1001)
      .withStartAt(new Date("2026-04-01T00:00:00.000Z"))
      .build();
    const fasterActivity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withId(1002)
      .withStartAt(new Date("2026-04-02T00:00:00.000Z"))
      .build();
    await DataSeedAsync.withActivities(
      slowerActivity,
      fasterActivity,
    ).seedAsync();
    await replaceActivityStreams({
      activityId: slowerActivity.id,
      streams: [
        { data: [0, 400, 800], streamType: "distance" },
        { data: [0, 80, 160], streamType: "elapsedTime" },
      ],
    });
    await replaceActivityStreams({
      activityId: fasterActivity.id,
      streams: [
        { data: [0, 400, 800], streamType: "distance" },
        { data: [0, 60, 120], streamType: "elapsedTime" },
      ],
    });
    const slowerJob = await enqueueActivityBestEffortCalculation({
      activityId: slowerActivity.id,
    });
    const fasterJob = await enqueueActivityBestEffortCalculation({
      activityId: fasterActivity.id,
    });

    await runWorkflow([slowerJob.id, fasterJob.id]);

    const [personalBest] = await db
      .select()
      .from(personalBestEfforts)
      .where(eq(personalBestEfforts.standardDistanceCode, "400m"));
    const efforts = await db.select().from(activityBestEfforts);
    expect(efforts.length).toBeGreaterThan(0);
    expect(personalBest).toMatchObject({
      activityId: fasterActivity.id,
      durationSeconds: 60,
      standardDistanceCode: "400m",
    });

    await db
      .update(activities)
      .set({ sportType: "hike" })
      .where(eq(activities.id, fasterActivity.id));
    const recalculationJob = await enqueueActivityBestEffortCalculation({
      activityId: fasterActivity.id,
    });

    await runWorkflow([recalculationJob.id]);

    const [refreshedPersonalBest] = await db
      .select()
      .from(personalBestEfforts)
      .where(eq(personalBestEfforts.standardDistanceCode, "400m"));
    expect(refreshedPersonalBest).toMatchObject({
      activityId: slowerActivity.id,
      durationSeconds: 80,
      standardDistanceCode: "400m",
    });

    await db
      .update(activities)
      .set({ sportType: "hike" })
      .where(eq(activities.id, slowerActivity.id));
    const finalJob = await enqueueActivityBestEffortCalculation({
      activityId: slowerActivity.id,
    });

    await runWorkflow([finalJob.id]);

    const finalPersonalBests = await db.select().from(personalBestEfforts);
    const job = await inspectJob({ id: finalJob.id });
    expect(finalPersonalBests).toEqual([]);
    expect(job).toMatchObject({
      state: "succeeded",
    });
  });
});

async function runWorkflow(jobIds: string[]) {
  const runtime = createJobRuntime({
    databaseUrl: requiredDatabaseUrl(),
    pollIntervalMs: 5,
    tasks: {
      [activityBestEffortJobModule.name]: activityBestEffortJobModule.handler,
    },
    workerId: "best-effort-integration",
  });

  try {
    await runtime.start();
    await expect
      .poll(async () => {
        const jobs = await Promise.all(jobIds.map((id) => inspectJob({ id })));
        return jobs.map((job) => `${job?.state}:${job?.lastError}`);
      })
      .toEqual(jobIds.map(() => "succeeded:null"));
  } finally {
    await runtime.stop();
  }
}

function requiredDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for integration tests");
  }

  return databaseUrl;
}
