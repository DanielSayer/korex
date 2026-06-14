import { getActivityDetailSummary } from "@korex/api/modules/activities/catalog/activity-detail-summary.service";
import {
  activityBestEfforts,
  activityEquipmentUses,
  activityHeartRateZoneSnapshots,
  activityHeartRateZoneTimes,
  activityLaps,
  db,
  equipment,
  user,
} from "@korex/db";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity detail summary service", () => {
  it("returns the nested activity detail summary for the authenticated user", async () => {
    const userId = userDataExtensions.HughJass.id;
    const activity = ActivityBuilder.initWithUser(userId)
      .withId(1201)
      .withName("Tempo Detail")
      .withStartAt(new Date("2026-04-08T06:30:00.000Z"))
      .withDistanceMeters(5000)
      .withMovingTimeSeconds(1300)
      .withAverageHeartRateBeatsPerMinute(152)
      .withMap({
        bounds: {
          northEast: { latitude: -27.58, longitude: 153.08 },
          southWest: { latitude: -27.59, longitude: 153.06 },
        },
        coordinates: [
          { latitude: -27.581, longitude: 153.061 },
          { latitude: -27.582, longitude: 153.062 },
        ],
      })
      .build();
    await DataSeedAsync.withActivities(activity).seedAsync();
    await db.insert(activityLaps).values([
      {
        activityId: activity.id,
        distanceMeters: 1000,
        elapsedTimeSeconds: 260,
        endTimeSeconds: 260,
        index: 0,
        movingTimeSeconds: 250,
        startTimeSeconds: 0,
      },
      {
        activityId: activity.id,
        distanceMeters: 1000,
        elapsedTimeSeconds: 520,
        endTimeSeconds: 520,
        index: 1,
        movingTimeSeconds: 500,
        startTimeSeconds: 260,
      },
    ]);
    await db.insert(activityHeartRateZoneSnapshots).values([
      {
        activityId: activity.id,
        maxBpm: 150,
        minBpm: 130,
        name: "Steady",
        position: 2,
      },
      {
        activityId: activity.id,
        maxBpm: null,
        minBpm: 151,
        name: "Hard",
        position: 3,
      },
    ]);
    await db.insert(activityHeartRateZoneTimes).values([
      { activityId: activity.id, position: 2, timeSeconds: 800 },
      { activityId: activity.id, position: 3, timeSeconds: 500 },
    ]);
    await db.insert(activityBestEfforts).values({
      activityId: activity.id,
      activityStartAt: activity.startAt,
      distanceMeters: 1000,
      durationSeconds: 240,
      endDistanceMeters: 3000,
      endElapsedTimeSeconds: 780,
      sportType: "run",
      standardDistanceCode: "1000m",
      startDistanceMeters: 2000,
      startElapsedTimeSeconds: 540,
      userId,
    });
    const [shoes] = await db
      .insert(equipment)
      .values({
        equipmentType: "shoes",
        name: "Tempo Shoes",
        userId,
      })
      .returning();
    if (!shoes) {
      throw new Error("Failed to create Equipment test data");
    }
    await db.insert(activityEquipmentUses).values({
      activityId: activity.id,
      equipmentId: shoes.id,
      equipmentType: "shoes",
      userId,
    });

    const result = await getActivityDetailSummary({
      activityId: activity.id,
      userId,
    });

    expect(result).toMatchObject({
      activity: {
        averageHeartRateBeatsPerMinute: 152,
        distanceMeters: 5000,
        id: activity.id,
        movingTimeSeconds: 1300,
        name: "Tempo Detail",
        sportType: "run",
      },
      activityEquipmentUses: [
        {
          activityId: activity.id,
          equipmentId: shoes.id,
          equipmentName: "Tempo Shoes",
          equipmentType: "shoes",
        },
      ],
      bestEfforts: [
        {
          distanceMeters: 1000,
          durationSeconds: 240,
          standardDistanceCode: "1000m",
        },
      ],
      heartRateZoneSnapshots: [
        { maxBpm: 150, minBpm: 130, name: "Steady", position: 2 },
        { maxBpm: null, minBpm: 151, name: "Hard", position: 3 },
      ],
      heartRateZoneTimes: [
        { position: 2, timeSeconds: 800 },
        { position: 3, timeSeconds: 500 },
      ],
      laps: [
        {
          distanceMeters: 1000,
          endTimeSeconds: 260,
          index: 0,
          startTimeSeconds: 0,
        },
        {
          distanceMeters: 1000,
          endTimeSeconds: 520,
          index: 1,
          startTimeSeconds: 260,
        },
      ],
      map: {
        bounds: {
          northEast: { latitude: -27.58, longitude: 153.08 },
          southWest: { latitude: -27.59, longitude: 153.06 },
        },
        coordinates: [
          { latitude: -27.581, longitude: 153.061 },
          { latitude: -27.582, longitude: 153.062 },
        ],
      },
    });
  });

  it("returns null when the activity is missing or belongs to another user", async () => {
    const ownerId = userDataExtensions.HughJass.id;
    const otherUser = {
      email: "detail-other@example.com",
      id: "detail-other-user-id",
      name: "Detail Other User",
    };
    const activity = ActivityBuilder.initWithUser(otherUser.id)
      .withId(2201)
      .build();
    await db.insert(user).values(otherUser);
    await DataSeedAsync.withActivities(activity).seedAsync();

    await expect(
      getActivityDetailSummary({ activityId: activity.id, userId: ownerId }),
    ).resolves.toBeNull();
    await expect(
      getActivityDetailSummary({ activityId: 999_999, userId: ownerId }),
    ).resolves.toBeNull();
  });
});
