import { ActivitySyncError } from "@korex/api/modules/activity-sync/activity-sync.errors";
import { toActivityMapFromIntervalsIcuMap } from "@korex/api/modules/activity-sync/providers/intervals-icu/intervals-icu-activity-map.acl";
import { describe, expect, it } from "vitest";

describe("Intervals.icu activity map ACL", () => {
  it("translates Intervals.icu map data into an Activity Map", () => {
    expect(
      toActivityMapFromIntervalsIcuMap({
        bounds: [
          [-27.590372, 153.06575],
          [-27.58015, 153.07713],
        ],
        latlngs: [
          [-27.581491, 153.06828],
          [-27.581144, 153.06902],
        ],
        route: null,
        weather: null,
      }),
    ).toEqual({
      bounds: {
        northEast: {
          latitude: -27.58015,
          longitude: 153.07713,
        },
        southWest: {
          latitude: -27.590372,
          longitude: 153.06575,
        },
      },
      coordinates: [
        {
          latitude: -27.581491,
          longitude: 153.06828,
        },
        {
          latitude: -27.581144,
          longitude: 153.06902,
        },
      ],
    });
  });

  it("allows missing bounds", () => {
    expect(
      toActivityMapFromIntervalsIcuMap({
        bounds: null,
        latlngs: [[-27.581491, 153.06828]],
      }),
    ).toEqual({
      bounds: null,
      coordinates: [
        {
          latitude: -27.581491,
          longitude: 153.06828,
        },
      ],
    });
  });

  it("rejects empty coordinates", () => {
    expect(() =>
      toActivityMapFromIntervalsIcuMap({
        bounds: null,
        latlngs: [],
      }),
    ).toThrow(ActivitySyncError);
  });

  it("rejects invalid coordinate tuples", () => {
    expect(() =>
      toActivityMapFromIntervalsIcuMap({
        latlngs: [[-91, 153.06828]],
      }),
    ).toThrow(ActivitySyncError);
  });

  it("rejects invalid bounds", () => {
    expect(() =>
      toActivityMapFromIntervalsIcuMap({
        bounds: [[-27.590372, 181]],
        latlngs: [[-27.581491, 153.06828]],
      }),
    ).toThrow(ActivitySyncError);
  });
});
