import { replaceActivityStreams } from "@korex/api/modules/activities/artifacts/activity-artifacts.repository";
import { replaceActivityHeartRateZoneSnapshots } from "@korex/api/modules/activities/heart-rate-zone-times/activity-heart-rate-zone-time.repository";
import { activityHeartRateZoneTimeJobModule } from "@korex/api/modules/activities/heart-rate-zone-times/activity-heart-rate-zone-time-job";
import { activityHeartRateZoneTimes, db } from "@korex/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity heart rate zone time calculation service", () => {
  it("calculates zone times and marks the job succeeded", async () => {
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
    await runHandler(activity.id);

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

  it("rejects the job when required inputs are missing", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withMovingTimeSeconds(null)
      .build();
    await DataSeedAsync.withActivities(activity).seedAsync();

    await expect(runHandler(activity.id)).rejects.toThrow(
      "Activity moving time is required",
    );

    const times = await db
      .select()
      .from(activityHeartRateZoneTimes)
      .where(eq(activityHeartRateZoneTimes.activityId, activity.id));

    expect(times).toEqual([]);
  });
});

function runHandler(activityId: number) {
  return activityHeartRateZoneTimeJobModule.handler(
    { activityId },
    {
      database: db,
      jobId: "heart-rate-zone-time-calculation",
      signal: new AbortController().signal,
    },
  );
}
