import { ActivitySyncError } from "@korex/api/modules/activity-sync/activity-sync.errors";
import { toActivityFromIntervalsIcuDetail } from "@korex/api/modules/activity-sync/providers/intervals-icu/intervals-icu-activity.acl";
import type { IntervalsIcuActivityDetail } from "@korex/integrations/intervals-icu/client";
import { describe, expect, it } from "vitest";

describe("Intervals.icu activity ACL", () => {
  it("translates supported activity summary fields into a Korex Activity", () => {
    const detail: IntervalsIcuActivityDetail = {
      average_cadence: 87.2,
      average_heartrate: 151.2,
      average_speed: 3.25,
      calories: 540.3,
      device_name: "Garmin Forerunner",
      distance: 10001.5,
      elapsed_time: 3900,
      id: "activity-1",
      max_heartrate: 181,
      max_speed: 5.8,
      moving_time: 3600,
      name: "Morning Run",
      start_date: "2026-04-01T20:00:00.000Z",
      start_date_local: "2026-04-02T06:00:00.000Z",
      total_elevation_gain: 123.4,
      total_elevation_loss: 120.2,
      type: "Run",
    };

    const result = toActivityFromIntervalsIcuDetail({
      detail,
      userId: "user-1",
    });

    expect(result).toEqual({
      activity: {
        averageCadenceStepsPerMinute: 174,
        averageHeartRateBeatsPerMinute: 151,
        averageSpeedMetersPerSecond: 3.25,
        deviceName: "Garmin Forerunner",
        distanceMeters: 10001.5,
        elapsedTimeSeconds: 3900,
        energyKilocalories: 540,
        maxHeartRateBeatsPerMinute: 181,
        maxSpeedMetersPerSecond: 5.8,
        movingTimeSeconds: 3600,
        name: "Morning Run",
        sportType: "run",
        startAt: new Date("2026-04-01T20:00:00.000Z"),
        totalElevationGainMeters: 123.4,
        totalElevationLossMeters: 120.2,
        userId: "user-1",
      },
      type: "activity",
    });
  });

  it("uses a default name and nulls invalid optional metrics", () => {
    const detail: IntervalsIcuActivityDetail = {
      average_cadence: 0,
      average_heartrate: -1,
      average_speed: 0,
      calories: 0,
      distance: 0,
      id: "activity-1",
      moving_time: 0,
      name: " ",
      start_date: "2026-04-01T20:00:00.000Z",
      type: "TreadmillRun",
    };

    const result = toActivityFromIntervalsIcuDetail({
      detail,
      userId: "user-1",
    });

    expect(result).toMatchObject({
      activity: {
        averageCadenceStepsPerMinute: null,
        averageHeartRateBeatsPerMinute: null,
        averageSpeedMetersPerSecond: null,
        distanceMeters: 0,
        energyKilocalories: 0,
        movingTimeSeconds: 0,
        name: "Treadmill Run",
        sportType: "treadmill",
      },
      type: "activity",
    });
  });

  it("skips unsupported sport types", () => {
    const detail: IntervalsIcuActivityDetail = {
      id: "activity-1",
      start_date: "2026-04-01T20:00:00.000Z",
      type: "Ride",
    };

    expect(
      toActivityFromIntervalsIcuDetail({ detail, userId: "user-1" }),
    ).toEqual({
      providerSportType: "Ride",
      type: "unsupported_sport_type",
    });
  });

  it("fails when a supported activity is missing a valid start date", () => {
    const detail: IntervalsIcuActivityDetail = {
      id: "activity-1",
      type: "Run",
    };

    expect(() =>
      toActivityFromIntervalsIcuDetail({ detail, userId: "user-1" }),
    ).toThrow(ActivitySyncError);
  });
});
