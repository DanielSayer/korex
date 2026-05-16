import {
  getCompletedTrainingWeek,
  getTrainingWeekStartAt,
} from "@korex/api/modules/activities/weekly-training-summaries/training-week";
import { describe, expect, it } from "vitest";

describe("training week", () => {
  it("uses Monday midnight in Australia/Brisbane as the training week boundary", () => {
    expect(
      getTrainingWeekStartAt(new Date("2026-05-10T13:59:59.999Z")),
    ).toEqual(new Date("2026-05-03T14:00:00.000Z"));
    expect(
      getTrainingWeekStartAt(new Date("2026-05-10T14:00:00.000Z")),
    ).toEqual(new Date("2026-05-10T14:00:00.000Z"));
  });

  it("returns the immediately completed training week", () => {
    expect(
      getCompletedTrainingWeek(new Date("2026-05-15T02:00:00.000Z")),
    ).toEqual({
      weekEndAt: new Date("2026-05-10T14:00:00.000Z"),
      weekStartAt: new Date("2026-05-03T14:00:00.000Z"),
    });
  });
});
