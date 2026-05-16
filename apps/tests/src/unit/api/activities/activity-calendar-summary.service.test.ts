import type { ActivitySummaryInput } from "@korex/api/modules/activities/activities.types";
import { summarizeActivitiesByWeek } from "@korex/api/modules/activities/catalog/activity-calendar-summary.service";
import { describe, expect, it } from "vitest";

function activity(
  input: Partial<ActivitySummaryInput> & { startAt: Date },
): ActivitySummaryInput {
  return {
    averageHeartRateBeatsPerMinute: null,
    distanceMeters: null,
    durationSeconds: null,
    name: "Run",
    totalElevationGainMeters: null,
    ...input,
  };
}

describe("summarizeActivitiesByWeek", () => {
  it("groups activities by Monday-start weeks and sums calendar totals", () => {
    expect(
      summarizeActivitiesByWeek([
        activity({
          distanceMeters: 1000,
          durationSeconds: 600,
          startAt: new Date("2026-04-06T08:00:00.000Z"),
          totalElevationGainMeters: 10.5,
        }),
        activity({
          distanceMeters: 2500,
          durationSeconds: 1200,
          startAt: new Date("2026-04-12T08:00:00.000Z"),
          totalElevationGainMeters: 20,
        }),
        activity({
          distanceMeters: 3000,
          durationSeconds: 1800,
          startAt: new Date("2026-04-13T08:00:00.000Z"),
          totalElevationGainMeters: 30,
        }),
      ]),
    ).toEqual([
      {
        distanceMeters: 3000,
        durationSeconds: 1800,
        totalElevationGainMeters: 30,
        weekStartDate: new Date(2026, 3, 13),
      },
      {
        distanceMeters: 3500,
        durationSeconds: 1800,
        totalElevationGainMeters: 30.5,
        weekStartDate: new Date(2026, 3, 6),
      },
    ]);
  });

  it("treats missing metrics as zero", () => {
    expect(
      summarizeActivitiesByWeek([
        activity({ startAt: new Date("2026-04-06T08:00:00.000Z") }),
      ]),
    ).toEqual([
      {
        distanceMeters: 0,
        durationSeconds: 0,
        totalElevationGainMeters: 0,
        weekStartDate: new Date(2026, 3, 6),
      },
    ]);
  });
});
