import { processActivityHeartRateZoneTimeCalculationJob } from "./activity-heart-rate-zone-time-calculation.service";
import { claimActivityHeartRateZoneTimeCalculationJobs } from "./activity-heart-rate-zone-time-jobs.repository";

export type RunActivityHeartRateZoneTimeWorkerOnceInput = {
  batchSize: number;
  now?: Date;
  staleLockMs: number;
  workerId: string;
};

export async function runActivityHeartRateZoneTimeWorkerOnce({
  batchSize,
  now = new Date(),
  staleLockMs,
  workerId,
}: RunActivityHeartRateZoneTimeWorkerOnceInput) {
  const jobs = await claimActivityHeartRateZoneTimeCalculationJobs({
    batchSize,
    now,
    staleLockedBefore: new Date(now.getTime() - staleLockMs),
    workerId,
  });

  for (const job of jobs) {
    await processActivityHeartRateZoneTimeCalculationJob(job);
  }

  return {
    processed: jobs.length,
  };
}
