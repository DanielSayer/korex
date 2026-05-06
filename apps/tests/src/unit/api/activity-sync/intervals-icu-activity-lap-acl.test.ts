import { ActivitySyncError } from "@korex/api/modules/activity-sync/activity-sync.errors";
import { toActivityLapsFromIntervalsIcuDetail } from "@korex/api/modules/activity-sync/providers/intervals-icu/intervals-icu-activity-lap.acl";
import type { IntervalsIcuActivityDetail } from "@korex/integrations/intervals-icu/client";
import { describe, expect, it } from "vitest";

describe("Intervals.icu activity lap ACL", () => {
  it("translates contiguous Intervals.icu intervals into Activity Laps", () => {
    const detail: IntervalsIcuActivityDetail = {
      icu_intervals: [
        {
          average_cadence: 78.91215,
          average_heartrate: 143,
          average_speed: 2.5762887,
          average_stride: 0.9794266,
          distance: 999.6,
          elapsed_time: 388,
          end_time: 388,
          max_heartrate: 165,
          max_speed: 2.725,
          moving_time: 388,
          start_time: 0,
          total_elevation_gain: 6.200001,
          type: "WORK",
        },
        {
          distance: 1001.4,
          end_time: 780,
          start_time: 388,
          type: "REST",
        },
      ],
      id: "activity-1",
    };

    expect(toActivityLapsFromIntervalsIcuDetail(detail)).toEqual([
      {
        averageCadenceStepsPerMinute: 158,
        averageHeartRateBeatsPerMinute: 143,
        averageSpeedMetersPerSecond: 2.5762887,
        averageStrideLengthMeters: 0.9794266,
        distanceMeters: 999.6,
        elapsedTimeSeconds: 388,
        endTimeSeconds: 388,
        index: 0,
        maxHeartRateBeatsPerMinute: 165,
        maxSpeedMetersPerSecond: 2.725,
        movingTimeSeconds: 388,
        startTimeSeconds: 0,
        totalElevationGainMeters: 6.200001,
      },
      {
        averageCadenceStepsPerMinute: null,
        averageHeartRateBeatsPerMinute: null,
        averageSpeedMetersPerSecond: null,
        averageStrideLengthMeters: null,
        distanceMeters: 1001.4,
        elapsedTimeSeconds: null,
        endTimeSeconds: 780,
        index: 1,
        maxHeartRateBeatsPerMinute: null,
        maxSpeedMetersPerSecond: null,
        movingTimeSeconds: null,
        startTimeSeconds: 388,
        totalElevationGainMeters: null,
      },
    ]);
  });

  it("returns no laps when Intervals.icu omits intervals", () => {
    expect(toActivityLapsFromIntervalsIcuDetail({ id: "activity-1" })).toEqual(
      [],
    );
  });

  it("rejects non-contiguous intervals", () => {
    const detail: IntervalsIcuActivityDetail = {
      icu_intervals: [
        { distance: 1000, end_time: 388, start_time: 0 },
        { distance: 1000, end_time: 780, start_time: 389 },
      ],
      id: "activity-1",
    };

    expect(() => toActivityLapsFromIntervalsIcuDetail(detail)).toThrow(
      ActivitySyncError,
    );
  });

  it("rejects intervals missing required distance", () => {
    const detail: IntervalsIcuActivityDetail = {
      icu_intervals: [{ end_time: 388, start_time: 0 }],
      id: "activity-1",
    };

    expect(() => toActivityLapsFromIntervalsIcuDetail(detail)).toThrow(
      ActivitySyncError,
    );
  });
});
