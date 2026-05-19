import { calculateActivityBestEfforts } from "@korex/api/modules/activities/best-efforts/activity-best-efforts";
import { describe, expect, it } from "vitest";

describe("activity best efforts", () => {
  it("calculates standard-distance efforts from paired distance and elapsed-time samples", () => {
    const efforts = calculateActivityBestEfforts({
      distanceSamples: [0, 200, 400, 800, 1000, 1600],
      elapsedTimeSamples: [0, 40, 80, 150, 190, 320],
    });

    expect(efforts).toEqual([
      expect.objectContaining({
        distanceMeters: 400,
        durationSeconds: 70,
        endDistanceMeters: 800,
        endElapsedTimeSeconds: 150,
        standardDistanceCode: "400m",
        startDistanceMeters: 400,
        startElapsedTimeSeconds: 80,
      }),
      expect.objectContaining({
        distanceMeters: 800,
        durationSeconds: 150,
        standardDistanceCode: "800m",
      }),
      expect.objectContaining({
        distanceMeters: 1000,
        durationSeconds: 190,
        standardDistanceCode: "1000m",
      }),
    ]);
  });

  it("interpolates effort boundaries between samples", () => {
    const [effort] = calculateActivityBestEfforts({
      distanceSamples: [0, 300, 700],
      elapsedTimeSamples: [0, 60, 120],
    });

    expect(effort).toMatchObject({
      distanceMeters: 400,
      durationSeconds: 60,
      endDistanceMeters: 700,
      endElapsedTimeSeconds: 120,
      standardDistanceCode: "400m",
      startDistanceMeters: 300,
      startElapsedTimeSeconds: 60,
    });
  });

  it("returns no efforts for mismatched or decreasing streams", () => {
    expect(
      calculateActivityBestEfforts({
        distanceSamples: [0, 400],
        elapsedTimeSamples: [0],
      }),
    ).toEqual([]);

    expect(
      calculateActivityBestEfforts({
        distanceSamples: [0, 400, 300],
        elapsedTimeSamples: [0, 60, 120],
      }),
    ).toEqual([]);

    expect(
      calculateActivityBestEfforts({
        distanceSamples: [0, 400, 800],
        elapsedTimeSamples: [0, 60, 30],
      }),
    ).toEqual([]);
  });

  it("keeps the earliest window when durations tie", () => {
    const [effort] = calculateActivityBestEfforts({
      distanceSamples: [0, 400, 800],
      elapsedTimeSamples: [0, 60, 120],
    });

    expect(effort).toMatchObject({
      durationSeconds: 60,
      endDistanceMeters: 400,
      startDistanceMeters: 0,
      startElapsedTimeSeconds: 0,
    });
  });
});
