import { processWeeklyTrainingSummaryGenerationJob } from "./weekly-training-summary-generation.service";
import { claimWeeklyTrainingSummaryGenerationJobs } from "./weekly-training-summary-jobs.repository";

export type RunWeeklyTrainingSummaryWorkerOnceInput = {
  batchSize: number;
  now?: Date;
  staleLockMs: number;
  workerId: string;
};

export async function runWeeklyTrainingSummaryWorkerOnce({
  batchSize,
  now = new Date(),
  staleLockMs,
  workerId,
}: RunWeeklyTrainingSummaryWorkerOnceInput) {
  const jobs = await claimWeeklyTrainingSummaryGenerationJobs({
    batchSize,
    now,
    staleLockedBefore: new Date(now.getTime() - staleLockMs),
    workerId,
  });

  for (const job of jobs) {
    await processWeeklyTrainingSummaryGenerationJob(job);
  }

  return {
    processed: jobs.length,
  };
}
