import { describe, expect, it } from "vitest";
import { getCalendarAgendaItems } from "../../../../web/src/features/calendar/utils/calendar-month";

describe("calendar agenda", () => {
  it("omits empty days and interleaves Training Week summaries with Activity days", () => {
    const items = getCalendarAgendaItems({
      activities: [
        activity({
          id: 1,
          name: "Morning run",
          startAt: "2026-06-03T06:30:00.000Z",
        }),
        activity({
          id: 2,
          name: "Lunch run",
          startAt: "2026-06-03T12:00:00.000Z",
        }),
        activity({
          id: 3,
          name: "Next week",
          startAt: "2026-06-08T07:00:00.000Z",
        }),
        activity({
          id: 4,
          name: "Later next week",
          startAt: "2026-06-14T07:00:00.000Z",
        }),
      ],
      summaries: [
        summary("2026-06-01T00:00:00.000Z"),
        summary("2026-06-08T00:00:00.000Z"),
      ],
      visibleMonth: new Date("2026-06-01T00:00:00.000Z"),
    });

    expect(items.map((item) => item.id)).toEqual([
      "summary-2026-06-08",
      "activities-2026-06-14",
      "activities-2026-06-08",
      "summary-2026-06-01",
      "activities-2026-06-03",
    ]);
    expect(items[4]?.type).toBe("activityDay");

    if (items[4]?.type !== "activityDay") {
      throw new Error("Expected an Activity day");
    }

    expect(items[4].activities.map((item) => item.name)).toEqual([
      "Lunch run",
      "Morning run",
    ]);
  });

  it("includes the Training Week summary for a visible Activity whose week starts in the previous month", () => {
    const items = getCalendarAgendaItems({
      activities: [
        activity({
          id: 1,
          name: "Month boundary run",
          startAt: "2026-07-01T06:30:00.000Z",
        }),
      ],
      summaries: [summary("2026-06-29T00:00:00.000Z")],
      visibleMonth: new Date("2026-07-01T00:00:00.000Z"),
    });

    expect(items.map((item) => item.id)).toEqual([
      "summary-2026-06-29",
      "activities-2026-07-01",
    ]);
  });

  it("does not show Activity days from adjacent months in the visible month agenda", () => {
    const items = getCalendarAgendaItems({
      activities: [
        activity({
          id: 1,
          name: "May run",
          startAt: "2026-05-31T06:30:00.000Z",
        }),
      ],
      summaries: [summary("2026-05-25T00:00:00.000Z")],
      visibleMonth: new Date("2026-06-01T00:00:00.000Z"),
    });

    expect(items).toEqual([]);
  });
});

function activity({
  id,
  name,
  startAt,
}: {
  id: number;
  name: string;
  startAt: string;
}) {
  return {
    averageHeartRateBeatsPerMinute: null,
    distanceMeters: 5000,
    durationSeconds: 1800,
    id,
    name,
    startAt: new Date(startAt),
  };
}

function summary(weekStartDate: string) {
  return {
    distanceMeters: 5000,
    durationSeconds: 1800,
    totalElevationGainMeters: 50,
    weekStartDate: new Date(weekStartDate),
  };
}
