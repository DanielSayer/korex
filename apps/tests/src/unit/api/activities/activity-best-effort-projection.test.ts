import {
  collectAffectedBestEffortDistanceCodes,
  type PersonalBestEffortCandidate,
  selectPersonalBestEffortCandidate,
} from "@korex/api/modules/activities/best-efforts/activity-best-effort-projection";
import { describe, expect, it } from "vitest";

describe("activity best effort projection", () => {
  it("collects affected distances from existing and replacement efforts", () => {
    const affected = collectAffectedBestEffortDistanceCodes({
      efforts: [
        {
          distanceMeters: 400,
          durationSeconds: 80,
          endDistanceMeters: 400,
          endElapsedTimeSeconds: 80,
          standardDistanceCode: "400m",
          startDistanceMeters: 0,
          startElapsedTimeSeconds: 0,
        },
        {
          distanceMeters: 5000,
          durationSeconds: 1200,
          endDistanceMeters: 5000,
          endElapsedTimeSeconds: 1200,
          standardDistanceCode: "5k",
          startDistanceMeters: 0,
          startElapsedTimeSeconds: 0,
        },
      ],
      existingDistanceCodes: ["400m", "10k"],
    });

    expect(affected).toEqual(["400m", "10k", "5k"]);
  });

  it("selects the shortest duration as the personal best", () => {
    const best = selectPersonalBestEffortCandidate([
      candidate({ activityBestEffortId: 1, durationSeconds: 80 }),
      candidate({ activityBestEffortId: 2, durationSeconds: 70 }),
    ]);

    expect(best).toMatchObject({
      activityBestEffortId: 2,
      durationSeconds: 70,
    });
  });

  it("breaks duration ties by earliest activity start and then effort id", () => {
    const best = selectPersonalBestEffortCandidate([
      candidate({
        activityBestEffortId: 3,
        activityStartAt: new Date("2026-04-02T00:00:00.000Z"),
      }),
      candidate({
        activityBestEffortId: 2,
        activityStartAt: new Date("2026-04-01T00:00:00.000Z"),
      }),
      candidate({
        activityBestEffortId: 1,
        activityStartAt: new Date("2026-04-01T00:00:00.000Z"),
      }),
    ]);

    expect(best).toMatchObject({
      activityBestEffortId: 1,
      activityStartAt: new Date("2026-04-01T00:00:00.000Z"),
    });
  });

  it("returns null when no candidates exist", () => {
    expect(selectPersonalBestEffortCandidate([])).toBeNull();
  });
});

function candidate(
  overrides: Partial<PersonalBestEffortCandidate>,
): PersonalBestEffortCandidate {
  return {
    activityBestEffortId: 1,
    activityId: 100,
    activityStartAt: new Date("2026-04-01T00:00:00.000Z"),
    distanceMeters: 400,
    durationSeconds: 80,
    endElapsedTimeSeconds: 80,
    sportType: "run",
    standardDistanceCode: "400m",
    startElapsedTimeSeconds: 0,
    ...overrides,
  };
}
