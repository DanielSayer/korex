import { DashboardWeeklyDistanceLive } from "@korex/api/modules/activities/dashboard/dashboard-weekly-distance.live";
import {
  getDashboardThisWeek,
  getDashboardWeeklyDistance,
} from "@korex/api/modules/activities/dashboard/dashboard-weekly-distance.service";
import { db, user } from "@korex/db";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("dashboard weekly distance service", () => {
  it("returns live weekly dashboard distance for the current user", async () => {
    const userId = userDataExtensions.HughJass.id;
    const otherUser = {
      email: "dashboard-other@example.com",
      id: "dashboard-other-user-id",
      name: "Dashboard Other User",
    };

    await db.insert(user).values(otherUser);
    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(1301)
        .withName("Old Visible Run")
        .withStartAt(new Date("2026-01-12T00:00:00.000Z"))
        .withDistanceMeters(17_000)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1302)
        .withName("Last Week Monday")
        .withStartAt(new Date("2026-02-23T00:00:00.000Z"))
        .withDistanceMeters(10_000)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1303)
        .withName("Last Week Same Point")
        .withStartAt(new Date("2026-02-26T05:00:00.000Z"))
        .withDistanceMeters(12_620)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1304)
        .withName("Last Week After Same Point")
        .withStartAt(new Date("2026-02-26T06:00:00.000Z"))
        .withDistanceMeters(5000)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1305)
        .withName("This Week Monday")
        .withStartAt(new Date("2026-03-02T00:00:00.000Z"))
        .withDistanceMeters(15_000)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1306)
        .withName("This Week Before Now")
        .withStartAt(new Date("2026-03-05T05:00:00.000Z"))
        .withDistanceMeters(12_620)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1307)
        .withName("This Week After Now")
        .withStartAt(new Date("2026-03-05T06:00:00.000Z"))
        .withDistanceMeters(9000)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1308)
        .withName("Hike Excluded")
        .withSportType("hike")
        .withStartAt(new Date("2026-03-04T00:00:00.000Z"))
        .withDistanceMeters(8000)
        .build(),
      ActivityBuilder.initWithUser(otherUser.id)
        .withId(2301)
        .withName("Other User Run")
        .withStartAt(new Date("2026-03-04T00:00:00.000Z"))
        .withDistanceMeters(20_000)
        .build(),
    ).seedAsync();

    const result = await Effect.runPromise(
      getDashboardWeeklyDistance({
        now: new Date("2026-03-05T05:30:00.000Z"),
        userId,
      }).pipe(Effect.provide(DashboardWeeklyDistanceLive)),
    );

    expect(result).toMatchObject({
      averageWeeklyDistanceMeters: 6020,
      distanceDeltaMeters: 5000,
      lastWeekAtSamePointDistanceMeters: 22_620,
      thisWeekDistanceMeters: 27_620,
      weekEndAt: new Date("2026-03-08T14:00:00.000Z"),
      weekStartAt: new Date("2026-03-01T14:00:00.000Z"),
    });
    expect(result.weeklyDistanceBuckets).toHaveLength(12);
    expect(result.weeklyDistanceBuckets.at(-1)).toMatchObject({
      activityCount: 2,
      distanceMeters: 27_620,
    });
    expect(result.weeklyDistanceBuckets.at(-2)).toMatchObject({
      activityCount: 3,
      distanceMeters: 27_620,
    });
  });

  it("returns this week dashboard metrics with embedded weekly distance", async () => {
    const userId = userDataExtensions.HughJass.id;

    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(1311)
        .withName("This Week Short")
        .withStartAt(new Date("2026-03-02T00:00:00.000Z"))
        .withDistanceMeters(5000)
        .withMovingTimeSeconds(1500)
        .withAverageHeartRateBeatsPerMinute(140)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1312)
        .withName("This Week Longer")
        .withStartAt(new Date("2026-03-04T00:00:00.000Z"))
        .withDistanceMeters(10_000)
        .withMovingTimeSeconds(3000)
        .withAverageHeartRateBeatsPerMinute(150)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(1313)
        .withName("Next Activity")
        .withStartAt(new Date("2026-03-05T06:00:00.000Z"))
        .withDistanceMeters(8000)
        .build(),
    ).seedAsync();

    const result = await Effect.runPromise(
      getDashboardThisWeek({
        now: new Date("2026-03-05T05:30:00.000Z"),
        userId,
      }).pipe(Effect.provide(DashboardWeeklyDistanceLive)),
    );

    expect(result).toMatchObject({
      activityCount: 2,
      averageHeartRateBeatsPerMinute: 145,
      averagePaceSecondsPerKilometer: 300,
      distanceMeters: 15_000,
      durationSeconds: 4500,
      weekEndAt: new Date("2026-03-08T14:00:00.000Z"),
      weekStartAt: new Date("2026-03-01T14:00:00.000Z"),
    });
    expect(result.weeklyDistance).toMatchObject({
      thisWeekDistanceMeters: 15_000,
      weekStartAt: new Date("2026-03-01T14:00:00.000Z"),
    });
  });
});
