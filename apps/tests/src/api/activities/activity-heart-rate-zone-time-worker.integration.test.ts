import { replaceActivityStreams } from "@korex/api/modules/activities/artifacts/activity-artifacts.repository";
import { replaceActivityHeartRateZoneSnapshots } from "@korex/api/modules/activities/heart-rate-zone-times/activity-heart-rate-zone-time.repository";
import { activityHeartRateZoneTimeJobModule } from "@korex/api/modules/activities/heart-rate-zone-times/activity-heart-rate-zone-time-job";
import { enqueueActivityHeartRateZoneTimeCalculation } from "@korex/api/modules/activities/heart-rate-zone-times/activity-heart-rate-zone-time-jobs.repository";
import {
  createJobRuntime,
  inspectJob,
} from "@korex/api/modules/job-runtime/job-runtime";
import { activityHeartRateZoneTimes, db } from "@korex/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity heart rate zone time worker", () => {
  it("claims and processes pending calculation jobs", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withMovingTimeSeconds(100)
      .build();
    await DataSeedAsync.withActivities(activity).seedAsync();
    await replaceActivityStreams({
      activityId: activity.id,
      streams: [
        {
          data: [120, 139, 140, 159, 160],
          streamType: "heartRate",
        },
      ],
    });
    await replaceActivityHeartRateZoneSnapshots({
      activityId: activity.id,
      snapshots: [
        {
          maxBpm: 140,
          minBpm: 120,
          name: "Easy",
          position: 1,
        },
        {
          maxBpm: 160,
          minBpm: 140,
          name: "Steady",
          position: 2,
        },
        {
          maxBpm: null,
          minBpm: 160,
          name: "Hard",
          position: 3,
        },
      ],
    });
    const job = await enqueueActivityHeartRateZoneTimeCalculation({
      activityId: activity.id,
    });

    const runtime = createJobRuntime({
      databaseUrl: requiredDatabaseUrl(),
      pollIntervalMs: 5,
      tasks: {
        [activityHeartRateZoneTimeJobModule.name]:
          activityHeartRateZoneTimeJobModule.handler,
      },
      workerId: "heart-rate-zone-time-integration",
    });

    try {
      await runtime.start();
      await expect
        .poll(
          async () =>
            (
              await inspectJob({
                id: job.id,
              })
            )?.state,
        )
        .toBe("succeeded");
    } finally {
      await runtime.stop();
    }

    const times = await db
      .select()
      .from(activityHeartRateZoneTimes)
      .where(eq(activityHeartRateZoneTimes.activityId, activity.id));

    expect(times).toEqual([
      expect.objectContaining({ position: 1, timeSeconds: 40 }),
      expect.objectContaining({ position: 2, timeSeconds: 40 }),
      expect.objectContaining({ position: 3, timeSeconds: 20 }),
    ]);
  });
});

function requiredDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for integration tests");
  }

  return databaseUrl;
}
