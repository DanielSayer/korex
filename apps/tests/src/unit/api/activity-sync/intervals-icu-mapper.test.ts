import { ActivitySyncError } from "@korex/api/modules/activity-sync/activity-sync.errors";
import { toExternalActivityUpsertInput } from "@korex/api/modules/activity-sync/providers/intervals-icu/intervals-icu-mapper";
import type { IntervalsIcuActivityDetail } from "@korex/integrations/intervals-icu/client";
import { describe, expect, it } from "vitest";

describe("Intervals.icu activity mapper", () => {
  it("maps activity detail into an external activity upsert input", () => {
    const detail: IntervalsIcuActivityDetail = {
      category: "Fallback Category",
      end_date: "2026-04-01T08:30:00.000Z",
      end_date_local: "2026-04-01T18:30:00.000Z",
      id: "activity-1",
      source: "Intervals.icu",
      sport: "Fallback Sport",
      start_date: "2026-04-01T07:00:00.000Z",
      start_date_local: "2026-04-01T17:00:00.000Z",
      start_time: "2026-04-01T06:30:00.000Z",
      type: "Run",
      updated: "2026-04-01T09:00:00.000Z",
      updated_at: "2026-04-01T19:00:00.000Z",
    };

    const result = toExternalActivityUpsertInput({
      detail,
      lastSyncRunId: 123,
      providerAthleteId: "athlete-1",
      userId: "user-1",
    });

    expect(result).toEqual({
      activityEndAt: new Date("2026-04-01T18:30:00.000Z"),
      activityStartAt: new Date("2026-04-01T17:00:00.000Z"),
      lastSyncRunId: 123,
      provider: "intervals_icu",
      providerActivityId: "activity-1",
      providerAthleteId: "athlete-1",
      providerUpdatedAt: new Date("2026-04-01T19:00:00.000Z"),
      rawData: detail,
      sourceType: "Intervals.icu",
      sportType: "Run",
      userId: "user-1",
    });
  });

  it("falls back across optional date and sport fields", () => {
    const detail: IntervalsIcuActivityDetail = {
      category: "Ride",
      end_date: "2026-04-01T08:30:00.000Z",
      id: "activity-1",
      start_time: "2026-04-01T06:30:00.000Z",
      updated: "2026-04-01T09:00:00.000Z",
    };

    const result = toExternalActivityUpsertInput({
      detail,
      lastSyncRunId: 123,
      providerAthleteId: "athlete-1",
      userId: "user-1",
    });

    expect(result).toMatchObject({
      activityEndAt: new Date("2026-04-01T08:30:00.000Z"),
      activityStartAt: new Date("2026-04-01T06:30:00.000Z"),
      providerUpdatedAt: new Date("2026-04-01T09:00:00.000Z"),
      sourceType: null,
      sportType: "Ride",
    });
  });

  it("fails when the activity start date is missing", () => {
    const detail: IntervalsIcuActivityDetail = {
      id: "activity-1",
    };

    expect(() =>
      toExternalActivityUpsertInput({
        detail,
        lastSyncRunId: 123,
        providerAthleteId: "athlete-1",
        userId: "user-1",
      }),
    ).toThrow(ActivitySyncError);
  });
});
