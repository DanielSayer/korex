import { getActivityStreams } from "@korex/api/modules/activities/catalog/activity-streams.service";
import { activityStreams, db, user } from "@korex/db";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity streams service", () => {
  it("returns chart-ready activity stream points aligned to elapsed time", async () => {
    const userId = userDataExtensions.HughJass.id;
    const activity = ActivityBuilder.initWithUser(userId)
      .withId(3401)
      .withMovingTimeSeconds(300)
      .build();
    await DataSeedAsync.withActivities(activity).seedAsync();
    await db.insert(activityStreams).values([
      {
        activityId: activity.id,
        data: [0, 60, 125],
        streamType: "elapsedTime",
      },
      {
        activityId: activity.id,
        data: [132, 148, 151],
        streamType: "heartRate",
      },
      {
        activityId: activity.id,
        data: [0, 320, 710],
        streamType: "distance",
      },
    ]);

    const result = await getActivityStreams({
      activityId: activity.id,
      userId,
    });

    expect(result).toEqual({
      altitude: [],
      cadence: [],
      distance: [
        { distanceMeters: 0, second: 0, value: 0 },
        { distanceMeters: 320, second: 60, value: 320 },
        { distanceMeters: 710, second: 125, value: 710 },
      ],
      heartRate: [
        { distanceMeters: 0, second: 0, value: 132 },
        { distanceMeters: 320, second: 60, value: 148 },
        { distanceMeters: 710, second: 125, value: 151 },
      ],
      velocity: [],
    });
  });

  it("returns null when the activity is missing or belongs to another user", async () => {
    const ownerId = userDataExtensions.HughJass.id;
    const otherUser = {
      email: "streams-other@example.com",
      id: "streams-other-user-id",
      name: "Streams Other User",
    };
    const activity = ActivityBuilder.initWithUser(otherUser.id)
      .withId(3402)
      .build();
    await db.insert(user).values(otherUser);
    await DataSeedAsync.withActivities(activity).seedAsync();

    await expect(
      getActivityStreams({ activityId: activity.id, userId: ownerId }),
    ).resolves.toBeNull();
    await expect(
      getActivityStreams({ activityId: 999_999, userId: ownerId }),
    ).resolves.toBeNull();
  });

  it("caps chart streams at 1200 points and falls back to inferred seconds", async () => {
    const userId = userDataExtensions.HughJass.id;
    const activity = ActivityBuilder.initWithUser(userId)
      .withId(3403)
      .withMovingTimeSeconds(2400)
      .build();
    await DataSeedAsync.withActivities(activity).seedAsync();
    await db.insert(activityStreams).values([
      {
        activityId: activity.id,
        data: [0, 60],
        streamType: "elapsedTime",
      },
      {
        activityId: activity.id,
        data: Array.from({ length: 1301 }, (_, index) => index),
        streamType: "distance",
      },
      {
        activityId: activity.id,
        data: [0, 3.2, -1, 3.4],
        streamType: "velocity",
      },
    ]);

    const result = await getActivityStreams({
      activityId: activity.id,
      userId,
    });

    expect(result?.distance).toHaveLength(1200);
    expect(result?.distance[0]).toEqual({
      distanceMeters: 0,
      second: 0,
      value: 0,
    });
    expect(result?.distance.at(-1)).toEqual({
      distanceMeters: 1300,
      second: 2400,
      value: 1300,
    });
    expect(result?.velocity).toEqual([
      { distanceMeters: 32.5, second: 60, value: 3.2 },
      { distanceMeters: 1300, second: 2400, value: 3.4 },
    ]);
  });
});
