import {
  getSportTypesForTrainingGoalScope,
  getTrainingGoalPeriodRange,
} from "@korex/api/modules/activities/training-goals/training-goals";
import { describe, expect, it } from "vitest";

describe("training goals", () => {
  it("uses the current Training Week for weekly goals", () => {
    expect(
      getTrainingGoalPeriodRange({
        date: new Date("2026-05-13T03:00:00.000Z"),
        period: "trainingWeek",
      }),
    ).toEqual({
      periodEndAt: new Date("2026-05-17T14:00:00.000Z"),
      periodStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });
  });

  it("uses Australia/Brisbane month boundaries for calendar month goals", () => {
    expect(
      getTrainingGoalPeriodRange({
        date: new Date("2026-05-31T13:59:59.999Z"),
        period: "calendarMonth",
      }),
    ).toEqual({
      periodEndAt: new Date("2026-05-31T14:00:00.000Z"),
      periodStartAt: new Date("2026-04-30T14:00:00.000Z"),
    });

    expect(
      getTrainingGoalPeriodRange({
        date: new Date("2026-05-31T14:00:00.000Z"),
        period: "calendarMonth",
      }),
    ).toEqual({
      periodEndAt: new Date("2026-06-30T14:00:00.000Z"),
      periodStartAt: new Date("2026-05-31T14:00:00.000Z"),
    });
  });

  it("maps Running Training Goal Sport Scope to run and treadmill Activities", () => {
    expect(getSportTypesForTrainingGoalScope("running")).toEqual([
      "run",
      "treadmill",
    ]);
  });
});
