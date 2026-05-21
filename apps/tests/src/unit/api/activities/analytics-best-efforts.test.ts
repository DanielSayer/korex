import {
  buildMonthlyBestEffortTrendBuckets,
  createMonthlyBestEffortBuckets,
  sortByStandardDistance,
  toPersonalBestEffort,
} from "@korex/api/modules/activities/analytics/analytics-best-efforts";
import { describe, expect, it } from "vitest";

describe("analytics best efforts", () => {
  it("sorts efforts by standard distance order", () => {
    const sorted = sortByStandardDistance([
      { standardDistanceCode: "10k" },
      { standardDistanceCode: "400m" },
      { standardDistanceCode: "5k" },
    ]);

    expect(sorted.map((effort) => effort.standardDistanceCode)).toEqual([
      "400m",
      "5k",
      "10k",
    ]);
  });

  it("converts database timestamps to UTC dates", () => {
    const effort = toPersonalBestEffort({
      activityId: 1,
      activityStartAt: "2026-04-01 00:00:00",
      distanceMeters: 400,
      durationSeconds: 70,
      standardDistanceCode: "400m",
    });

    expect(effort.activityStartAt).toEqual(
      new Date("2026-04-01T00:00:00.000Z"),
    );
  });

  it("builds month-end personal-best trend buckets", () => {
    const buckets = createMonthlyBestEffortBuckets(2026).slice(0, 3);
    const trendBuckets = buildMonthlyBestEffortTrendBuckets({
      buckets,
      rows: [
        {
          activityId: 1,
          activityStartAt: new Date("2026-01-15T00:00:00.000Z"),
          distanceMeters: 400,
          durationSeconds: 80,
          standardDistanceCode: "400m",
        },
        {
          activityId: 2,
          activityStartAt: new Date("2026-02-15T00:00:00.000Z"),
          distanceMeters: 400,
          durationSeconds: 70,
          standardDistanceCode: "400m",
        },
        {
          activityId: 3,
          activityStartAt: new Date("2026-03-15T00:00:00.000Z"),
          distanceMeters: 5000,
          durationSeconds: 1200,
          standardDistanceCode: "5k",
        },
      ],
    });

    const fourHundredMeterBuckets = trendBuckets.filter(
      (bucket) => bucket.standardDistanceCode === "400m",
    );
    const fiveKilometerBuckets = trendBuckets.filter(
      (bucket) => bucket.standardDistanceCode === "5k",
    );

    expect(
      fourHundredMeterBuckets.map((bucket) => bucket.durationSeconds),
    ).toEqual([80, 70, 70]);
    expect(
      fiveKilometerBuckets.map((bucket) => bucket.durationSeconds),
    ).toEqual([null, null, 1200]);
  });
});
