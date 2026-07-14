import { activityStreamReplacementModule } from "@korex/api/modules/activities/activity-stream-replacement/activity-stream-replacement.module";
import { replaceActivityStreams } from "@korex/api/modules/activities/artifacts/activity-artifacts.repository";
import { activityBestEffortJobModule } from "@korex/api/modules/activities/best-efforts/activity-best-effort-job";
import { replaceActivityHeartRateZoneTimes } from "@korex/api/modules/activities/heart-rate-zone-times/activity-heart-rate-zone-time.repository";
import { activityHeartRateZoneTimeJobModule } from "@korex/api/modules/activities/heart-rate-zone-times/activity-heart-rate-zone-time-job";
import { replaceActivityHeartRateZoneSnapshotsAndQueueCalculation } from "@korex/api/modules/activities/heart-rate-zone-times/activity-heart-rate-zone-time-snapshots";
import {
  activityHeartRateZoneSnapshots,
  activityHeartRateZoneTimes,
  activityStreams,
  db,
  jobRuntimeJobs,
} from "@korex/db";
import { and, eq, sql } from "drizzle-orm";
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
    const job = await getJob(activity.id);

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
      attemptCount: 0,
      lastError: null,
      payload: { activityId: activity.id },
      state: "queued",
    });
  });
});

describe("activity heart rate zone time workflow", () => {
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

    await activityStreamReplacementModule.replaceActivityStreamsAndInvalidateDerivedData(
      {
        activityId: activity.id,
        streams: [{ data: [130, 150], streamType: "heartRate" }],
        userId: userDataExtensions.HughJass.id,
      },
    );

    const snapshots = await db
      .select()
      .from(activityHeartRateZoneSnapshots)
      .where(eq(activityHeartRateZoneSnapshots.activityId, activity.id));
    const times = await db
      .select()
      .from(activityHeartRateZoneTimes)
      .where(eq(activityHeartRateZoneTimes.activityId, activity.id));
    const job = await getJob(activity.id);

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
      attemptCount: 0,
      payload: { activityId: activity.id },
      state: "queued",
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

    await activityStreamReplacementModule.replaceActivityStreamsAndInvalidateDerivedData(
      {
        activityId: activity.id,
        streams: [{ data: [0, 10], streamType: "distance" }],
        userId: userDataExtensions.HughJass.id,
      },
    );

    const snapshots = await db
      .select()
      .from(activityHeartRateZoneSnapshots)
      .where(eq(activityHeartRateZoneSnapshots.activityId, activity.id));
    const times = await db
      .select()
      .from(activityHeartRateZoneTimes)
      .where(eq(activityHeartRateZoneTimes.activityId, activity.id));
    const job = await getJob(activity.id);

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

    await activityStreamReplacementModule.replaceActivityStreamsAndInvalidateDerivedData(
      {
        activityId: activity.id,
        streams: [{ data: [130, 150], streamType: "heartRate" }],
        userId: "user-without-heart-rate-zones",
      },
    );

    const snapshots = await db
      .select()
      .from(activityHeartRateZoneSnapshots)
      .where(eq(activityHeartRateZoneSnapshots.activityId, activity.id));
    const times = await db
      .select()
      .from(activityHeartRateZoneTimes)
      .where(eq(activityHeartRateZoneTimes.activityId, activity.id));
    const job = await getJob(activity.id);

    expect(snapshots).toEqual([]);
    expect(times).toEqual([]);
    expect(job).toBeUndefined();
  });

  it("rolls back stream replacement and derived-data invalidation when a late write fails", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    const zone = HeartRateZoneBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    await DataSeedAsync.withActivities(activity)
      .withHeartRateZones(zone)
      .seedAsync();
    await replaceActivityStreams({
      activityId: activity.id,
      streams: [{ data: [130, 140], streamType: "heartRate" }],
    });
    await replaceActivityHeartRateZoneSnapshotsAndQueueCalculation({
      activityId: activity.id,
      snapshots: [zone],
    });
    await replaceActivityHeartRateZoneTimes({
      activityId: activity.id,
      times: [{ position: 1, timeSeconds: 123 }],
    });

    await db.execute(sql`
      CREATE FUNCTION fail_activity_hr_job_delete()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'forced activity heart rate job delete failure';
      END;
      $$ LANGUAGE plpgsql
    `);
    await db.execute(sql`
      CREATE TRIGGER fail_activity_hr_job_delete
      BEFORE DELETE ON job_runtime_jobs
      FOR EACH ROW EXECUTE FUNCTION fail_activity_hr_job_delete()
    `);

    try {
      await expect(
        activityStreamReplacementModule.replaceActivityStreamsAndInvalidateDerivedData(
          {
            activityId: activity.id,
            streams: [{ data: [0, 10], streamType: "distance" }],
            userId: userDataExtensions.HughJass.id,
          },
        ),
      ).rejects.toThrow();
    } finally {
      await db.execute(sql`
        DROP TRIGGER fail_activity_hr_job_delete ON job_runtime_jobs
      `);
      await db.execute(sql`DROP FUNCTION fail_activity_hr_job_delete()`);
    }

    const streams = await db
      .select({
        data: activityStreams.data,
        streamType: activityStreams.streamType,
      })
      .from(activityStreams)
      .where(eq(activityStreams.activityId, activity.id));
    const snapshots = await db
      .select()
      .from(activityHeartRateZoneSnapshots)
      .where(eq(activityHeartRateZoneSnapshots.activityId, activity.id));
    const times = await db
      .select()
      .from(activityHeartRateZoneTimes)
      .where(eq(activityHeartRateZoneTimes.activityId, activity.id));
    const heartRateJobs = await db
      .select()
      .from(jobRuntimeJobs)
      .where(
        and(
          eq(jobRuntimeJobs.name, activityHeartRateZoneTimeJobModule.name),
          eq(jobRuntimeJobs.key, String(activity.id)),
        ),
      );
    const bestEffortJobs = await db
      .select()
      .from(jobRuntimeJobs)
      .where(
        and(
          eq(jobRuntimeJobs.name, activityBestEffortJobModule.name),
          eq(jobRuntimeJobs.key, String(activity.id)),
        ),
      );

    expect(streams).toEqual([{ data: [130, 140], streamType: "heartRate" }]);
    expect(snapshots).toEqual([expect.objectContaining({ position: 1 })]);
    expect(times).toEqual([
      expect.objectContaining({ position: 1, timeSeconds: 123 }),
    ]);
    expect(heartRateJobs).toHaveLength(1);
    expect(bestEffortJobs).toEqual([]);
  });
});

async function getJob(activityId: number) {
  const [job] = await db
    .select()
    .from(jobRuntimeJobs)
    .where(
      and(
        eq(jobRuntimeJobs.name, activityHeartRateZoneTimeJobModule.name),
        eq(jobRuntimeJobs.key, String(activityId)),
      ),
    );

  return job;
}
