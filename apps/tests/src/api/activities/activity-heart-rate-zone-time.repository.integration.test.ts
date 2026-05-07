import {
  replaceActivityHeartRateZoneSnapshotsAndQueueCalculation,
  replaceActivityHeartRateZoneTimes,
  replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation,
} from "@korex/api/modules/activities/activity-heart-rate-zone-time.repository";
import {
  claimActivityHeartRateZoneTimeCalculationJobs,
  enqueueActivityHeartRateZoneTimeCalculation,
  markActivityHeartRateZoneTimeCalculationFailed,
  markActivityHeartRateZoneTimeCalculationSucceeded,
} from "@korex/api/modules/activities/activity-heart-rate-zone-time-jobs.repository";
import {
  activityHeartRateZoneSnapshots,
  activityHeartRateZoneTimeCalculationJobs,
  activityHeartRateZoneTimes,
  db,
} from "@korex/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { HeartRateZoneBuilder } from "../../setup/integration/test-data/heart-rate-zone-builder";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity heart rate zone time repositories", () => {
  it("replaces snapshots, deletes stale times, and queues calculation in one operation", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    await DataSeedAsync.withActivities(activity).seedAsync();

    await replaceActivityHeartRateZoneTimes({
      activityId: activity.id,
      times: [{ position: 1, timeSeconds: 123 }],
    });
    await enqueueActivityHeartRateZoneTimeCalculation({
      activityId: activity.id,
    });
    await markActivityHeartRateZoneTimeCalculationFailed({
      error: "old failure",
      jobId: await getJobId(activity.id),
      now: new Date("2026-04-01T00:00:00.000Z"),
    });

    await replaceActivityHeartRateZoneSnapshotsAndQueueCalculation({
      activityId: activity.id,
      snapshots: [
        {
          maxBpm: 140,
          minBpm: 120,
          name: "Easy",
          position: 1,
        },
        {
          maxBpm: null,
          minBpm: 140,
          name: "Hard",
          position: 2,
        },
      ],
    });

    const snapshots = await db
      .select()
      .from(activityHeartRateZoneSnapshots)
      .where(eq(activityHeartRateZoneSnapshots.activityId, activity.id));
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

    expect(snapshots).toEqual([
      expect.objectContaining({
        activityId: activity.id,
        maxBpm: 140,
        minBpm: 120,
        name: "Easy",
        position: 1,
      }),
      expect.objectContaining({
        activityId: activity.id,
        maxBpm: null,
        minBpm: 140,
        name: "Hard",
        position: 2,
      }),
    ]);
    expect(times).toEqual([]);
    expect(job).toMatchObject({
      activityId: activity.id,
      attemptCount: 0,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
      status: "pending",
    });
  });

  it("claims pending jobs and marks them succeeded", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    await DataSeedAsync.withActivities(activity).seedAsync();
    await enqueueActivityHeartRateZoneTimeCalculation({
      activityId: activity.id,
    });

    const job = await claimSingleJob();

    expect(job).toMatchObject({
      activityId: activity.id,
      attemptCount: 0,
      id: expect.any(Number),
    });

    await markActivityHeartRateZoneTimeCalculationSucceeded({
      jobId: job.id,
      now: new Date("2026-04-01T00:00:01.000Z"),
    });

    const [storedJob] = await db
      .select()
      .from(activityHeartRateZoneTimeCalculationJobs)
      .where(eq(activityHeartRateZoneTimeCalculationJobs.id, job.id));

    expect(storedJob).toMatchObject({
      finishedAt: new Date("2026-04-01T00:00:01.000Z"),
      lockedAt: null,
      lockedBy: null,
      status: "succeeded",
    });
  });

  it("does not claim fresh processing jobs but recovers stale locks", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    await DataSeedAsync.withActivities(activity).seedAsync();
    await enqueueActivityHeartRateZoneTimeCalculation({
      activityId: activity.id,
    });

    const [claimedJob] = await claimActivityHeartRateZoneTimeCalculationJobs({
      batchSize: 10,
      now: new Date("2026-04-01T00:00:00.000Z"),
      staleLockedBefore: new Date("2026-03-31T23:59:00.000Z"),
      workerId: "worker-1",
    });
    const claimed = requireJob(claimedJob);

    const freshClaim = await claimActivityHeartRateZoneTimeCalculationJobs({
      batchSize: 10,
      now: new Date("2026-04-01T00:00:30.000Z"),
      staleLockedBefore: new Date("2026-03-31T23:59:30.000Z"),
      workerId: "worker-2",
    });
    const staleClaim = await claimActivityHeartRateZoneTimeCalculationJobs({
      batchSize: 10,
      now: new Date("2026-04-01T00:01:30.000Z"),
      staleLockedBefore: new Date("2026-04-01T00:00:30.000Z"),
      workerId: "worker-2",
    });

    expect(freshClaim).toEqual([]);
    expect(staleClaim).toEqual([
      expect.objectContaining({
        id: claimed.id,
      }),
    ]);
  });

  it("retries failed jobs with short backoff and stops after three attempts", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    await DataSeedAsync.withActivities(activity).seedAsync();
    await enqueueActivityHeartRateZoneTimeCalculation({
      activityId: activity.id,
    });
    const job = await claimSingleJob();

    await markActivityHeartRateZoneTimeCalculationFailed({
      error: "first failure",
      jobId: job.id,
      now: new Date("2026-04-01T00:00:00.000Z"),
    });
    await markActivityHeartRateZoneTimeCalculationFailed({
      error: "second failure",
      jobId: job.id,
      now: new Date("2026-04-01T00:00:01.000Z"),
    });
    await markActivityHeartRateZoneTimeCalculationFailed({
      error: "third failure",
      jobId: job.id,
      now: new Date("2026-04-01T00:00:03.000Z"),
    });

    const [storedJob] = await db
      .select()
      .from(activityHeartRateZoneTimeCalculationJobs)
      .where(eq(activityHeartRateZoneTimeCalculationJobs.id, job.id));
    const finalClaim = await claimActivityHeartRateZoneTimeCalculationJobs({
      batchSize: 10,
      now: new Date("2026-04-01T00:00:08.000Z"),
      staleLockedBefore: new Date("2026-04-01T00:00:00.000Z"),
      workerId: "worker-1",
    });

    expect(storedJob).toMatchObject({
      attemptCount: 3,
      lastError: "third failure",
      runAfter: new Date("2026-04-01T00:00:07.000Z"),
      status: "failed",
    });
    expect(finalClaim).toEqual([]);
  });

  it("replaces streams, captures current heart rate zones, and queues calculation", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    const easyZone = HeartRateZoneBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    const hardZone = HeartRateZoneBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withId(1002)
      .withMaxBpm(null)
      .withMinBpm(140)
      .withName("Hard")
      .withPosition(2)
      .build();
    await DataSeedAsync.withActivities(activity)
      .withHeartRateZones(easyZone, hardZone)
      .seedAsync();

    await replaceActivityHeartRateZoneTimes({
      activityId: activity.id,
      times: [{ position: 1, timeSeconds: 123 }],
    });

    await replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation({
      activityId: activity.id,
      streams: [{ data: [130, 150], streamType: "heartRate" }],
      userId: userDataExtensions.HughJass.id,
    });

    const snapshots = await db
      .select()
      .from(activityHeartRateZoneSnapshots)
      .where(eq(activityHeartRateZoneSnapshots.activityId, activity.id));
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

    expect(snapshots).toEqual([
      expect.objectContaining({
        maxBpm: 140,
        minBpm: 120,
        name: "Easy",
        position: 1,
      }),
      expect.objectContaining({
        maxBpm: null,
        minBpm: 140,
        name: "Hard",
        position: 2,
      }),
    ]);
    expect(times).toEqual([]);
    expect(job).toMatchObject({
      activityId: activity.id,
      attemptCount: 0,
      status: "pending",
    });
  });

  it("clears snapshots, stale times, and queued work when replacement has no heart rate stream", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    const zone = HeartRateZoneBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    await DataSeedAsync.withActivities(activity)
      .withHeartRateZones(zone)
      .seedAsync();
    await replaceActivityHeartRateZoneSnapshotsAndQueueCalculation({
      activityId: activity.id,
      snapshots: [zone],
    });
    await replaceActivityHeartRateZoneTimes({
      activityId: activity.id,
      times: [{ position: 1, timeSeconds: 123 }],
    });

    await replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation({
      activityId: activity.id,
      streams: [{ data: [0, 10], streamType: "distance" }],
      userId: userDataExtensions.HughJass.id,
    });

    const snapshots = await db
      .select()
      .from(activityHeartRateZoneSnapshots)
      .where(eq(activityHeartRateZoneSnapshots.activityId, activity.id));
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

    expect(snapshots).toEqual([]);
    expect(times).toEqual([]);
    expect(job).toBeUndefined();
  });

  it("clears snapshots, stale times, and queued work when there are no heart rate zones", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    const zone = HeartRateZoneBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    await DataSeedAsync.withActivities(activity)
      .withHeartRateZones(zone)
      .seedAsync();
    await replaceActivityHeartRateZoneSnapshotsAndQueueCalculation({
      activityId: activity.id,
      snapshots: [zone],
    });
    await replaceActivityHeartRateZoneTimes({
      activityId: activity.id,
      times: [{ position: 1, timeSeconds: 123 }],
    });

    await replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation({
      activityId: activity.id,
      streams: [{ data: [130, 150], streamType: "heartRate" }],
      userId: "user-without-heart-rate-zones",
    });

    const snapshots = await db
      .select()
      .from(activityHeartRateZoneSnapshots)
      .where(eq(activityHeartRateZoneSnapshots.activityId, activity.id));
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

    expect(snapshots).toEqual([]);
    expect(times).toEqual([]);
    expect(job).toBeUndefined();
  });
});

async function getJobId(activityId: number) {
  const [job] = await db
    .select({ id: activityHeartRateZoneTimeCalculationJobs.id })
    .from(activityHeartRateZoneTimeCalculationJobs)
    .where(eq(activityHeartRateZoneTimeCalculationJobs.activityId, activityId));

  if (!job) {
    throw new Error("Expected activity heart rate zone time job");
  }

  return job.id;
}

async function claimSingleJob() {
  const [job] = await claimActivityHeartRateZoneTimeCalculationJobs({
    batchSize: 10,
    now: new Date("2026-04-01T00:00:00.000Z"),
    staleLockedBefore: new Date("2026-03-31T23:59:00.000Z"),
    workerId: "worker-1",
  });

  return requireJob(job);
}

function requireJob<T>(job: T | undefined): T {
  if (!job) {
    throw new Error("Expected activity heart rate zone time job");
  }

  return job;
}
