import { processActivityRouteHeatmapCalculationJob } from "./activity-route-heatmap-calculation.service";
import { claimActivityRouteHeatmapCalculationJobs } from "./activity-route-heatmap-jobs.repository";

export type RunActivityRouteHeatmapWorkerOnceInput = {
  batchSize: number;
  now?: Date;
  staleLockMs: number;
  workerId: string;
};

export async function runActivityRouteHeatmapWorkerOnce({
  batchSize,
  now = new Date(),
  staleLockMs,
  workerId,
}: RunActivityRouteHeatmapWorkerOnceInput) {
  const jobs = await claimActivityRouteHeatmapCalculationJobs({
    batchSize,
    now,
    staleLockedBefore: new Date(now.getTime() - staleLockMs),
    workerId,
  });

  for (const job of jobs) {
    await processActivityRouteHeatmapCalculationJob(job);
  }

  return {
    processed: jobs.length,
  };
}
