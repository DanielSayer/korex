import {
  buildAnalyticsVolume,
  createMonthlyAnalyticsVolumeBuckets,
  createWeeklyAnalyticsVolumeBuckets,
} from "@korex/api/modules/activities/analytics/analytics-volume";
import { describe, expect, it } from "vitest";

describe("analytics volume", () => {
  it("creates monthly buckets on Brisbane calendar month boundaries", () => {
    const buckets = createMonthlyAnalyticsVolumeBuckets(2026);

    expect(buckets).toHaveLength(12);
    expect(buckets[0]).toMatchObject({
      bucketEndAt: new Date("2026-01-31T14:00:00.000Z"),
      bucketStartAt: new Date("2025-12-31T14:00:00.000Z"),
    });
    expect(buckets[11]).toMatchObject({
      bucketEndAt: new Date("2026-12-31T14:00:00.000Z"),
      bucketStartAt: new Date("2026-11-30T14:00:00.000Z"),
    });
  });

  it("creates weekly buckets on training week boundaries inside the year", () => {
    const buckets = createWeeklyAnalyticsVolumeBuckets(2026);

    expect(buckets[0]).toMatchObject({
      bucketEndAt: new Date("2026-01-11T14:00:00.000Z"),
      bucketStartAt: new Date("2026-01-04T14:00:00.000Z"),
    });
    expect(buckets.at(-1)).toMatchObject({
      bucketEndAt: new Date("2027-01-03T14:00:00.000Z"),
      bucketStartAt: new Date("2026-12-27T14:00:00.000Z"),
    });
  });

  it("fills missing buckets and calculates cumulative totals", () => {
    const buckets = createMonthlyAnalyticsVolumeBuckets(2026).slice(0, 3);
    const analytics = buildAnalyticsVolume({
      bucketMode: "monthly",
      buckets,
      rows: [
        {
          activityCount: 2,
          bucketStartAt: "2025-12-31 14:00:00",
          distanceMeters: 5000,
          durationSeconds: 1800,
        },
        {
          activityCount: 1,
          bucketStartAt: new Date("2026-02-28T14:00:00.000Z"),
          distanceMeters: 3000,
          durationSeconds: 1200,
        },
      ],
      year: 2026,
    });

    expect(analytics.totalActivityCount).toBe(3);
    expect(analytics.totalDistanceMeters).toBe(8000);
    expect(analytics.totalDurationSeconds).toBe(3000);
    expect(analytics.buckets).toEqual([
      expect.objectContaining({
        activityCount: 2,
        cumulativeDistanceMeters: 5000,
        distanceMeters: 5000,
      }),
      expect.objectContaining({
        activityCount: 0,
        cumulativeDistanceMeters: 5000,
        distanceMeters: 0,
      }),
      expect.objectContaining({
        activityCount: 1,
        cumulativeDistanceMeters: 8000,
        distanceMeters: 3000,
      }),
    ]);
  });
});
