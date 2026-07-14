import { enqueueCompletedTrainingStreakUpdates } from "@korex/api/modules/activities/activities.workers";
import { activityBestEffortJobModule } from "@korex/api/modules/activities/best-efforts/activity-best-effort-job";
import { activityHeartRateZoneTimeJobModule } from "@korex/api/modules/activities/heart-rate-zone-times/activity-heart-rate-zone-time-job";
import { activityRouteHeatmapJobModule } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-job";
import { trainingStreakJobModule } from "@korex/api/modules/activities/training-streaks/training-streak-job";
import { weeklyTrainingSummaryJobModule } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary-job";
import { weeklyTrainingSummaryScheduleJobModule } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary-schedule-job";
import { activitySyncJobModule } from "@korex/api/modules/activity-sync/activity-sync.live";
import { createJobRuntime } from "@korex/api/modules/job-runtime/job-runtime";
import { runWeeklyTrainingSummarySchedulerOnce } from "./weekly-training-summary-scheduler";

const pollIntervalMs = 1000;
const schedulerIntervalMs = 60_000;

const jobRuntime = createJobRuntime({
  databaseUrl: requiredEnv("DATABASE_URL"),
  tasks: {
    [activitySyncJobModule.name]: activitySyncJobModule.handler,
    [activityBestEffortJobModule.name]: activityBestEffortJobModule.handler,
    [activityHeartRateZoneTimeJobModule.name]:
      activityHeartRateZoneTimeJobModule.handler,
    [activityRouteHeatmapJobModule.name]: activityRouteHeatmapJobModule.handler,
    [trainingStreakJobModule.name]: trainingStreakJobModule.handler,
    [weeklyTrainingSummaryJobModule.name]:
      weeklyTrainingSummaryJobModule.handler,
    [weeklyTrainingSummaryScheduleJobModule.name]:
      weeklyTrainingSummaryScheduleJobModule.handler,
  },
});
await jobRuntime.start();

let shuttingDown = false;
let lastSchedulerRunAt = 0;

process.on("SIGINT", () => {
  shuttingDown = true;
});

process.on("SIGTERM", () => {
  shuttingDown = true;
});

while (!shuttingDown) {
  try {
    const now = Date.now();

    if (now - lastSchedulerRunAt >= schedulerIntervalMs) {
      lastSchedulerRunAt = now;
      const schedulerResult = await runWeeklyTrainingSummarySchedulerOnce({
        now: new Date(now),
      });

      if (schedulerResult.scheduled) {
        console.info(
          `Ensured weekly training summary schedule for ${schedulerResult.weekStartAt.toISOString()}`,
        );
      }

      const streakSchedulerResult = await enqueueCompletedTrainingStreakUpdates(
        {
          now: new Date(now),
        },
      );

      if (streakSchedulerResult.enqueued > 0) {
        console.info(
          `Enqueued ${streakSchedulerResult.enqueued} training streak jobs for ${streakSchedulerResult.weekStartAt.toISOString()}`,
        );
      }
    }
  } catch (error) {
    console.error(error);
  }

  await sleep(pollIntervalMs);
}

await jobRuntime.stop();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}
