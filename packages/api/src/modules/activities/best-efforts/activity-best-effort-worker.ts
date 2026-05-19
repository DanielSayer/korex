import { processActivityBestEffortCalculationJob } from "./activity-best-effort-calculation.service";
import { claimActivityBestEffortCalculationJobs } from "./activity-best-effort-jobs.repository";

export type RunActivityBestEffortWorkerOnceInput = {
  batchSize: number;
  now?: Date;
  staleLockMs: number;
  workerId: string;
};

export async function runActivityBestEffortWorkerOnce({
  batchSize,
  now = new Date(),
  staleLockMs,
  workerId,
}: RunActivityBestEffortWorkerOnceInput) {
  const jobs = await claimActivityBestEffortCalculationJobs({
    batchSize,
    now,
    staleLockedBefore: new Date(now.getTime() - staleLockMs),
    workerId,
  });

  for (const job of jobs) {
    await processActivityBestEffortCalculationJob(job);
  }

  return {
    processed: jobs.length,
  };
}
