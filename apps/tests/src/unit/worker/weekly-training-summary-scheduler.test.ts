import { describe, expect, it } from "vitest";
import { runWeeklyTrainingSummarySchedulerOnce } from "../../../../worker/src/weekly-training-summary-scheduler";

describe("weekly training summary scheduler", () => {
  it("skips before Monday 6am in Australia/Brisbane", async () => {
    await expect(
      runWeeklyTrainingSummarySchedulerOnce({
        now: new Date("2026-05-17T19:59:59.999Z"),
      }),
    ).resolves.toEqual({ enqueued: 0, skipped: true });
  });
});
