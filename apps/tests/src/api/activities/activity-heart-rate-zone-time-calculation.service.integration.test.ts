import {
  replaceActivityHeartRateZoneSnapshots,
  replaceActivityStreams,
} from "@korex/api/modules/activities/activities.repository";
import { processActivityHeartRateZoneTimeCalculationJob } from "@korex/api/modules/activities/activity-heart-rate-zone-time-calculation.service";
import {
  claimActivityHeartRateZoneTimeCalculationJobs,
  enqueueActivityHeartRateZoneTimeCalculation,
} from "@korex/api/modules/activities/activity-heart-rate-zone-time-jobs.repository";
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

describe("activity heart rate zone time calculation service", () => {
  it("calculates zone times and marks the job succeeded", async () => {
    const activity = ActivityBuilder.initWithUser(userDataExtensions.HughJass.id)
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

    await processActivityHeartRateZoneTimeCalculationJob(
      await claimSingleJob(),
    );

    const times = await db
      .select()
      .from(activityHeartRateZoneTimes)
      .where(eq(activityHeartRateZoneTimes.activityId, activity.id));
    const [job] = await db
      .select()
      .from(activityHeartRateZoneTimeCalculationJobs)
      .where(
        eq(
          activityHeartRateZoneTimeCalculationJobs.activityId,
          activity.id,
        ),
      );

    expect(times).toEqual([
      expect.objectContaining({ position: 1, timeSeconds: 40 }),
      expect.objectContaining({ position: 2, timeSeconds: 40 }),
      expect.objectContaining({ position: 3, timeSeconds: 20 }),
    ]);
    expect(job).toMatchObject({
      attemptCount: 0,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
      status: "succeeded",
    });
    expect(job?.finishedAt).toBeInstanceOf(Date);
  });

  it("marks the job failed when required inputs are missing", async () => {
    const activity = ActivityBuilder.initWithUser(userDataExtensions.HughJass.id)
      .withMovingTimeSeconds(null)
      .build();
    await DataSeedAsync.withActivities(activity).seedAsync();

    await enqueueActivityHeartRateZoneTimeCalculation({
      activityId: activity.id,
    });

    await processActivityHeartRateZoneTimeCalculationJob(
      await claimSingleJob(),
    );

    const times = await db
      .select()
      .from(activityHeartRateZoneTimes)
      .where(eq(activityHeartRateZoneTimes.activityId, activity.id));
    const [job] = await db
      .select()
      .from(activityHeartRateZoneTimeCalculationJobs)
      .where(
        eq(
          activityHeartRateZoneTimeCalculationJobs.activityId,
          activity.id,
        ),
      );

    expect(times).toEqual([]);
    expect(job).toMatchObject({
      attemptCount: 1,
      lastError: "Activity moving time is required",
      lockedAt: null,
      lockedBy: null,
      status: "failed",
    });
  });
});

async function claimSingleJob() {
  const [job] = await claimActivityHeartRateZoneTimeCalculationJobs({
    batchSize: 10,
    now: new Date("2026-04-01T00:00:00.000Z"),
    staleLockedBefore: new Date("2026-03-31T23:59:00.000Z"),
    workerId: "worker-1",
  });

  if (!job) {
    throw new Error("Expected activity heart rate zone time job");
  }

  return job;
}
