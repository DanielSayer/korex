import {
  getRecentActivities,
  listActivitiesForDateRange,
} from "@korex/api/modules/activities/catalog/activity-catalog.repository";
import { db, user } from "@korex/db";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("recent activities repository", () => {
  it("returns the five most recent activities for the user with summary fields and maps", async () => {
    const userId = userDataExtensions.HughJass.id;
    const otherUser = {
      email: "other@example.com",
      id: "other-user-id",
      name: "Other User",
    };

    const activities = [
      ActivityBuilder.initWithUser(userId)
        .withId(1001)
        .withName("Old Run")
        .withStartAt(new Date("2026-04-01T00:00:00.000Z"))
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1002)
        .withName("Easy Run")
        .withStartAt(new Date("2026-04-02T00:00:00.000Z"))
        .withMovingTimeSeconds(1800)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1003)
        .withName("Steady Run")
        .withStartAt(new Date("2026-04-03T00:00:00.000Z"))
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1004)
        .withName("Hike")
        .withStartAt(new Date("2026-04-04T00:00:00.000Z"))
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1005)
        .withName("Tempo Run")
        .withStartAt(new Date("2026-04-05T00:00:00.000Z"))
        .withDistanceMeters(5000)
        .withAverageHeartRateBeatsPerMinute(151)
        .withMap({
          bounds: {
            northEast: { latitude: -27.58015, longitude: 153.07713 },
            southWest: { latitude: -27.590372, longitude: 153.06575 },
          },
          coordinates: [
            { latitude: -27.581491, longitude: 153.06828 },
            { latitude: -27.581144, longitude: 153.06902 },
          ],
        })
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1006)
        .withName("Long Run")
        .withStartAt(new Date("2026-04-06T00:00:00.000Z"))
        .build(),
      ActivityBuilder.initWithUser(otherUser.id)
        .withId(2001)
        .withName("Someone Else")
        .withStartAt(new Date("2026-04-07T00:00:00.000Z"))
        .build(),
    ];

    await db.insert(user).values(otherUser);
    await DataSeedAsync.withActivities(...activities).seedAsync();

    const result = await getRecentActivities({ userId });

    expect(result.map((activity) => activity.name)).toEqual([
      "Long Run",
      "Tempo Run",
      "Hike",
      "Steady Run",
      "Easy Run",
    ]);
    expect(result[1]).toMatchObject({
      averageHeartRateBeatsPerMinute: 151,
      distanceMeters: 5000,
      durationSeconds: 300,
      id: 1005,
      map: {
        bounds: {
          northEast: { latitude: -27.58015, longitude: 153.07713 },
          southWest: { latitude: -27.590372, longitude: 153.06575 },
        },
        coordinates: [
          { latitude: -27.581491, longitude: 153.06828 },
          { latitude: -27.581144, longitude: 153.06902 },
        ],
      },
      name: "Tempo Run",
      startAt: new Date("2026-04-05T00:00:00.000Z"),
    });
    expect(result[0]?.map).toBeNull();
  });

  it("returns activities for a date range without maps", async () => {
    const userId = userDataExtensions.HughJass.id;
    const otherUser = {
      email: "range-other@example.com",
      id: "range-other-user-id",
      name: "Range Other User",
    };

    await db.insert(user).values(otherUser);
    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(1101)
        .withName("Before Range")
        .withStartAt(new Date("2026-04-01T23:59:59.999Z"))
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1102)
        .withName("Range Start")
        .withStartAt(new Date("2026-04-02T00:00:00.000Z"))
        .withMovingTimeSeconds(1200)
        .withDistanceMeters(3000)
        .withTotalElevationGainMeters(24.5)
        .withAverageHeartRateBeatsPerMinute(140)
        .withMap({
          bounds: null,
          coordinates: [{ latitude: -27.58, longitude: 153.07 }],
        })
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1103)
        .withName("Range End")
        .withStartAt(new Date("2026-04-03T00:00:00.000Z"))
        .withDistanceMeters(1500)
        .withTotalElevationGainMeters(12)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1104)
        .withName("After Range")
        .withStartAt(new Date("2026-04-03T00:00:00.001Z"))
        .build(),
      ActivityBuilder.initWithUser(otherUser.id)
        .withId(2101)
        .withName("Other User Range")
        .withStartAt(new Date("2026-04-02T12:00:00.000Z"))
        .build(),
    ).seedAsync();

    const result = await listActivitiesForDateRange({
      endDate: new Date("2026-04-03T00:00:00.000Z"),
      startDate: new Date("2026-04-02T00:00:00.000Z"),
      userId,
    });

    expect(result).toEqual([
      {
        averageHeartRateBeatsPerMinute: null,
        distanceMeters: 1500,
        durationSeconds: 300,
        name: "Range End",
        startAt: new Date("2026-04-03T00:00:00.000Z"),
        totalElevationGainMeters: 12,
      },
      {
        averageHeartRateBeatsPerMinute: 140,
        distanceMeters: 3000,
        durationSeconds: 1200,
        name: "Range Start",
        startAt: new Date("2026-04-02T00:00:00.000Z"),
        totalElevationGainMeters: 24.5,
      },
    ]);
    expect(result[1]).not.toHaveProperty("map");
  });
});
