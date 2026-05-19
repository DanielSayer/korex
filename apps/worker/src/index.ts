import {
  runActivityBestEffortWorkerOnce,
  runActivityHeartRateZoneTimeWorkerOnce,
  runActivityRouteHeatmapWorkerOnce,
  runWeeklyTrainingSummaryWorkerOnce,
} from "@korex/api/modules/activities/activities.workers";
import { runWeeklyTrainingSummarySchedulerOnce } from "./weekly-training-summary-scheduler";

const batchSize = 10;
const pollIntervalMs = 1000;
const schedulerIntervalMs = 60_000;
const staleLockMs = 60_000;

let shuttingDown = false;
let lastSchedulerRunAt = 0;

process.on("SIGINT", () => {
  shuttingDown = true;
});

process.on("SIGTERM", () => {
  shuttingDown = true;
});

const workerId = createWorkerId();

while (!shuttingDown) {
  try {
    const now = Date.now();

    if (now - lastSchedulerRunAt >= schedulerIntervalMs) {
      lastSchedulerRunAt = now;
      const schedulerResult = await runWeeklyTrainingSummarySchedulerOnce({
        now: new Date(now),
      });

      if (schedulerResult.skipped === false && schedulerResult.enqueued > 0) {
        console.info(
          `Enqueued ${schedulerResult.enqueued} weekly training summary jobs for ${schedulerResult.weekStartAt.toISOString()}`,
        );
      }
    }

    const result = await runActivityHeartRateZoneTimeWorkerOnce({
      batchSize,
      staleLockMs,
      workerId,
    });

    if (result.processed > 0) {
      console.info(
        `Processed ${result.processed} activity heart-rate zone time jobs`,
      );
    }

    const summaryResult = await runWeeklyTrainingSummaryWorkerOnce({
      batchSize,
      staleLockMs,
      workerId,
    });

    if (summaryResult.processed > 0) {
      console.info(
        `Processed ${summaryResult.processed} weekly training summary jobs`,
      );
    }

    const heatmapResult = await runActivityRouteHeatmapWorkerOnce({
      batchSize,
      staleLockMs,
      workerId,
    });

    if (heatmapResult.processed > 0) {
      console.info(
        `Processed ${heatmapResult.processed} activity route heatmap jobs`,
      );
    }

    const bestEffortResult = await runActivityBestEffortWorkerOnce({
      batchSize,
      staleLockMs,
      workerId,
    });

    if (bestEffortResult.processed > 0) {
      console.info(
        `Processed ${bestEffortResult.processed} activity best effort jobs`,
      );
    }
  } catch (error) {
    console.error(error);
  }

  await sleep(pollIntervalMs);
}

function createWorkerId() {
  return `worker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
