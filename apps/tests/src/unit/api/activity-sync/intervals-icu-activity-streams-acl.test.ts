import { ActivitySyncError } from "@korex/api/modules/activity-sync/activity-sync.errors";
import { toActivityStreamsFromIntervalsIcuStreams } from "@korex/api/modules/activity-sync/providers/intervals-icu/intervals-icu-activity-streams.acl";
import { describe, expect, it } from "vitest";

describe("Intervals.icu activity streams ACL", () => {
  it("translates supported Intervals.icu streams into Activity Streams", () => {
    expect(
      toActivityStreamsFromIntervalsIcuStreams({
        cadence: {
          data: [82, 83.4],
          type: "cadence",
        },
        distance: {
          data: [0, 8.5],
          type: "distance",
        },
        fixed_altitude: {
          data: [48.1, 48.3],
          type: "fixed_altitude",
        },
        heartrate: {
          data: [140, 142],
          type: "heartrate",
        },
        velocity_smooth: {
          data: [3.1, 3.2],
          type: "velocity_smooth",
        },
      }),
    ).toEqual([
      {
        data: [164, 167],
        streamType: "cadence",
      },
      {
        data: [0, 8.5],
        streamType: "distance",
      },
      {
        data: [48.1, 48.3],
        streamType: "altitude",
      },
      {
        data: [140, 142],
        streamType: "heartRate",
      },
      {
        data: [3.1, 3.2],
        streamType: "velocity",
      },
    ]);
  });

  it("ignores unsupported Intervals.icu stream types", () => {
    expect(
      toActivityStreamsFromIntervalsIcuStreams({
        watts: {
          data: [200, 210],
          type: "watts",
        },
      }),
    ).toEqual([]);
  });

  it("rejects supported streams without numeric array data", () => {
    expect(() =>
      toActivityStreamsFromIntervalsIcuStreams({
        heartrate: {
          data: [140, null],
          type: "heartrate",
        },
      }),
    ).toThrow(ActivitySyncError);
  });

  it("rejects invalid Intervals.icu cadence values", () => {
    expect(() =>
      toActivityStreamsFromIntervalsIcuStreams({
        cadence: {
          data: [0],
          type: "cadence",
        },
      }),
    ).toThrow(ActivitySyncError);
  });
});
