import { replaceActivityStreams } from "@korex/api/modules/activities/activity-artifacts.repository";
import { replaceActivityHeartRateZoneSnapshots } from "@korex/api/modules/activities/activity-heart-rate-zone-time.repository";
import { enqueueActivityHeartRateZoneTimeCalculation } from "@korex/api/modules/activities/activity-heart-rate-zone-time-jobs.repository";
import { runActivityHeartRateZoneTimeWorkerOnce } from "@korex/api/modules/activities/activity-heart-rate-zone-time-worker";
import {
  activityHeartRateZoneTimeCalculationJobs,
  activityHeartRateZoneTimes,
  db,
} from "@korex/db";
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
    await enqueueActivityHeartRateZoneTimeCalculation({
      activityId: activity.id,
    });

    const result = await runActivityHeartRateZoneTimeWorkerOnce({
      batchSize: 10,
      now: new Date("2026-04-01T00:00:00.000Z"),
      staleLockMs: 60_000,
      workerId: "worker-1",
    });

    const times = await db
      .select()
      .from(activityHeartRateZoneTimes)
      .where(eq(activityHeartRateZoneTimes.activityId, activity.id));
    const [job] = await db
      .select()
      .from(activityHeartRateZoneTimeCalculationJobs)
      .where(
        eq(activityHeartRateZoneTimeCalculationJobs.activityId, activity.id),
      );

    expect(result).toEqual({ processed: 1 });
    expect(times).toEqual([
      expect.objectContaining({ position: 1, timeSeconds: 40 }),
      expect.objectContaining({ position: 2, timeSeconds: 40 }),
      expect.objectContaining({ position: 3, timeSeconds: 20 }),
    ]);
    expect(job).toMatchObject({
      lockedAt: null,
      lockedBy: null,
      status: "succeeded",
    });
  });
});
