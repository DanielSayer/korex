import { describe, expect, it } from "vitest";
import { runWeeklyTrainingSummarySchedulerOnce } from "../../../../worker/src/weekly-training-summary-scheduler";

describe("weekly training summary scheduler", () => {
  it("skips before Monday 6am in Australia/Brisbane", async () => {
    await expect(
      runWeeklyTrainingSummarySchedulerOnce({
        now: new Date("2026-05-17T19:59:59.999Z"),
      }),
    ).resolves.toEqual({ scheduled: false });
  });

  it("keys the completed-week occurrence", async () => {
    const occurrences: Array<Record<string, unknown>> = [];

    await runWeeklyTrainingSummarySchedulerOnce({
      enqueueOccurrence: async (input) => {
        occurrences.push(input);
        return { id: "schedule-job" };
      },
      now: new Date("2026-05-17T20:00:00.000Z"),
    });

    expect(occurrences).toEqual([
      expect.objectContaining({
        scheduleKey: "2026-05-10T14:00:00.000Z",
      }),
    ]);
  });
});
