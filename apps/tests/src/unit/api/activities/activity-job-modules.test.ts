import { activityBestEffortJobModule } from "@korex/api/modules/activities/best-efforts/activity-best-effort-job";
import { activityHeartRateZoneTimeJobModule } from "@korex/api/modules/activities/heart-rate-zone-times/activity-heart-rate-zone-time-job";
import { activityRouteHeatmapJobModule } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-job";
import { trainingStreakJobModule } from "@korex/api/modules/activities/training-streaks/training-streak-job";
import { weeklyTrainingSummaryJobModule } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary-job";
import { weeklyTrainingSummaryScheduleJobModule } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary-schedule-job";
import { db } from "@korex/db";
import { describe, expect, it } from "vitest";

const context = {
  database: db,
  jobId: "job-module-test",
  signal: new AbortController().signal,
};

describe("activity job modules", () => {
  it.each([
    [
      activityBestEffortJobModule,
      {},
      "Activity best effort job requires an integer activityId",
    ],
    [
      activityHeartRateZoneTimeJobModule,
      {},
      "Activity Heart Rate Zone Time job requires an integer activityId",
    ],
    [
      activityRouteHeatmapJobModule,
      {},
      "Activity Route Heatmap job requires an integer activityId",
    ],
    [trainingStreakJobModule, {}, "Training Streak job requires a userId"],
    [
      trainingStreakJobModule,
      { userId: "user-1" },
      "Training Streak job requires a valid weekStartAt",
    ],
    [
      weeklyTrainingSummaryJobModule,
      {},
      "Weekly Training Summary job requires a userId",
    ],
    [
      weeklyTrainingSummaryJobModule,
      { userId: "user-1" },
      "Weekly Training Summary job requires a valid weekStartAt",
    ],
    [
      weeklyTrainingSummaryScheduleJobModule,
      {},
      "Weekly Training Summary schedule job requires a valid weekStartAt",
    ],
  ])("validates the %s payload", async (job, payload, message) => {
    await expect(job.handler(payload, context)).rejects.toThrow(message);
  });

  it("checks cancellation before parsing the payload", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      activityBestEffortJobModule.handler(
        {},
        { ...context, signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
