import { calculateActivityHeartRateZoneTimes } from "@korex/api/modules/activities/activity-heart-rate-zone-times";
import { describe, expect, it } from "vitest";

const snapshots = [
  {
    maxBpm: 140,
    minBpm: 120,
    name: "Easy",
    position: 1,
  },
  {
    maxBpm: 160,
    minBpm: 140,
    name: "Steady",
    position: 2,
  },
  {
    maxBpm: null,
    minBpm: 160,
    name: "Hard",
    position: 3,
  },
];

describe("calculateActivityHeartRateZoneTimes", () => {
  it("calculates zone times from heart rate samples and moving time", () => {
    expect(
      calculateActivityHeartRateZoneTimes({
        heartRateSamples: [120, 139, 140, 159, 160],
        movingTimeSeconds: 100,
        snapshots,
      }),
    ).toEqual([
      { position: 1, timeSeconds: 40 },
      { position: 2, timeSeconds: 40 },
      { position: 3, timeSeconds: 20 },
    ]);
  });

  it("treats max bpm as exclusive and unbounded max as open-ended", () => {
    expect(
      calculateActivityHeartRateZoneTimes({
        heartRateSamples: [139, 140, 159, 160, 190],
        movingTimeSeconds: 50,
        snapshots,
      }),
    ).toEqual([
      { position: 1, timeSeconds: 10 },
      { position: 2, timeSeconds: 20 },
      { position: 3, timeSeconds: 20 },
    ]);
  });

  it("ignores samples outside all snapshots", () => {
    expect(
      calculateActivityHeartRateZoneTimes({
        heartRateSamples: [100, 119, 120, 161],
        movingTimeSeconds: 40,
        snapshots,
      }),
    ).toEqual([
      { position: 1, timeSeconds: 10 },
      { position: 3, timeSeconds: 10 },
    ]);
  });

  it("sums fractional sample durations before rounding final zone totals", () => {
    expect(
      calculateActivityHeartRateZoneTimes({
        heartRateSamples: [120, 121, 140],
        movingTimeSeconds: 10,
        snapshots,
      }),
    ).toEqual([
      { position: 1, timeSeconds: 7 },
      { position: 2, timeSeconds: 3 },
    ]);
  });

  it("returns no times without moving time, samples, or snapshots", () => {
    expect(
      calculateActivityHeartRateZoneTimes({
        heartRateSamples: [120],
        movingTimeSeconds: null,
        snapshots,
      }),
    ).toEqual([]);

    expect(
      calculateActivityHeartRateZoneTimes({
        heartRateSamples: [],
        movingTimeSeconds: 10,
        snapshots,
      }),
    ).toEqual([]);

    expect(
      calculateActivityHeartRateZoneTimes({
        heartRateSamples: [120],
        movingTimeSeconds: 10,
        snapshots: [],
      }),
    ).toEqual([]);
  });
});
