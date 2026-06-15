import {
  buildDashboardThisWeek,
  buildDashboardWeeklyDistance,
  createDashboardWeeklyDistanceBuckets,
  getLastWeekSamePointRange,
} from "@korex/api/modules/activities/dashboard/dashboard-weekly-distance";
import { describe, expect, it } from "vitest";

describe("dashboard weekly distance", () => {
  it("creates 12 weekly buckets ending with the current in-progress training week", () => {
    const buckets = createDashboardWeeklyDistanceBuckets({
      now: new Date("2026-03-05T05:30:00.000Z"),
    });

    expect(buckets).toHaveLength(12);
    expect(buckets[0]).toMatchObject({
      bucketEndAt: new Date("2025-12-21T14:00:00.000Z"),
      bucketStartAt: new Date("2025-12-14T14:00:00.000Z"),
    });
    expect(buckets.at(-1)).toMatchObject({
      bucketEndAt: new Date("2026-03-08T14:00:00.000Z"),
      bucketStartAt: new Date("2026-03-01T14:00:00.000Z"),
    });
  });

  it("builds totals, deltas, and average from the visible buckets", () => {
    const result = buildDashboardWeeklyDistance({
      lastWeekAtSamePointDistanceMeters: 12_000,
      now: new Date("2026-03-05T05:30:00.000Z"),
      rows: [
        {
          activityCount: 2,
          bucketStartAt: "2026-02-22 14:00:00",
          distanceMeters: 18_000,
        },
        {
          activityCount: 3,
          bucketStartAt: new Date("2026-03-01T14:00:00.000Z"),
          distanceMeters: 27_000,
        },
      ],
    });

    expect(result).toMatchObject({
      averageWeeklyDistanceMeters: 3750,
      distanceDeltaMeters: 15_000,
      lastWeekAtSamePointDistanceMeters: 12_000,
      thisWeekDistanceMeters: 27_000,
      weekEndAt: new Date("2026-03-08T14:00:00.000Z"),
      weekStartAt: new Date("2026-03-01T14:00:00.000Z"),
    });
    expect(result.weeklyDistanceBuckets.at(-1)).toMatchObject({
      activityCount: 3,
      distanceMeters: 27_000,
    });
  });

  it("uses the same elapsed point in the previous training week", () => {
    const range = getLastWeekSamePointRange(
      new Date("2026-03-05T05:30:00.000Z"),
    );

    expect(range).toEqual({
      endAt: new Date("2026-02-26T05:30:00.000Z"),
      startAt: new Date("2026-02-22T14:00:00.000Z"),
    });
  });

  it("builds this week metrics from current training week activity totals", () => {
    const weeklyDistance = buildDashboardWeeklyDistance({
      lastWeekAtSamePointDistanceMeters: 12_000,
      now: new Date("2026-03-05T05:30:00.000Z"),
      rows: [],
    });

    const result = buildDashboardThisWeek({
      row: {
        activityCount: 2,
        averageHeartRateBeatsPerMinute: 142.5,
        distanceMeters: 15_000,
        durationSeconds: 4500,
        energyKilocalories: 1040,
      },
      weeklyFocus: {
        action: "Easy-to-steady run",
        body: "Hold steady.",
        reasons: [],
        status: "steady",
        title: "Hold steady.",
        tone: "good",
      },
      weeklyDistance,
    });

    expect(result).toMatchObject({
      activityCount: 2,
      averageHeartRateBeatsPerMinute: 142.5,
      averagePaceSecondsPerKilometer: 300,
      distanceMeters: 15_000,
      durationSeconds: 4500,
      energyKilocalories: 1040,
      weeklyFocus: {
        status: "steady",
      },
      weekEndAt: new Date("2026-03-08T14:00:00.000Z"),
      weekStartAt: new Date("2026-03-01T14:00:00.000Z"),
    });
  });
});
