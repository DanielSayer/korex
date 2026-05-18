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
        time: {
          data: [0, 2],
          type: "time",
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
        data: [0, 2],
        streamType: "elapsedTime",
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

  it("translates Intervals.icu stream arrays", () => {
    expect(
      toActivityStreamsFromIntervalsIcuStreams([
        {
          data: [140, 142],
          type: "heartrate",
        },
        {
          data: [82, 83.4],
          type: "cadence",
        },
        {
          data: [200, 210],
          type: "watts",
        },
      ]),
    ).toEqual([
      {
        data: [140, 142],
        streamType: "heartRate",
      },
      {
        data: [164, 167],
        streamType: "cadence",
      },
    ]);
  });

  it("skips all-null streams and null sample gaps", () => {
    expect(
      toActivityStreamsFromIntervalsIcuStreams([
        {
          allNull: true,
          data: null,
          type: "heartrate",
        },
        {
          data: [140, null, 142],
          type: "heartrate",
        },
        {
          data: [0, 82],
          type: "cadence",
        },
      ]),
    ).toEqual([
      {
        data: [140, 142],
        streamType: "heartRate",
      },
      {
        data: [164],
        streamType: "cadence",
      },
    ]);
  });

  it("rejects supported streams without usable data", () => {
    expect(() =>
      toActivityStreamsFromIntervalsIcuStreams({
        heartrate: {
          data: null,
          type: "heartrate",
        },
      }),
    ).toThrow(ActivitySyncError);
  });

  it("skips invalid Intervals.icu cadence values", () => {
    expect(
      toActivityStreamsFromIntervalsIcuStreams({
        cadence: {
          data: [0],
          type: "cadence",
        },
      }),
    ).toEqual([]);
  });
});
