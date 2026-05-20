import { db } from "@korex/db";
import { Effect, Layer } from "effect";
import {
  getActivityBestEffortCalculationInputs,
  refreshPersonalBestEfforts,
  replaceActivityBestEfforts,
} from "./activity-best-effort.repository";
import {
  type ActivityBestEffortCalculationJob,
  claimActivityBestEffortCalculationJobs,
  markActivityBestEffortCalculationFailed,
  markActivityBestEffortCalculationSucceeded,
} from "./activity-best-effort-jobs.repository";
import { ActivityBestEffortWorkflow } from "./activity-best-effort-workflow.dependencies";
import { calculateActivityBestEfforts } from "./activity-best-efforts";

export const ActivityBestEffortWorkflowLive = Layer.succeed(
  ActivityBestEffortWorkflow,
  {
    processActivityBestEffortCalculationJob: (job) =>
      Effect.promise(() => processActivityBestEffortCalculationJob(job)),
    runActivityBestEffortWorkerOnce: ({
      batchSize,
      now = new Date(),
      staleLockMs,
      workerId,
    }) =>
      Effect.promise(async () => {
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
      }),
  },
);

async function processActivityBestEffortCalculationJob(
  job: ActivityBestEffortCalculationJob,
) {
  try {
    const inputs = await getActivityBestEffortCalculationInputs({
      activityId: job.activityId,
    });

    if (!inputs.activity) {
      await markActivityBestEffortCalculationSucceeded({ jobId: job.id });
      return;
    }

    const { activity } = inputs;
    const efforts =
      activity.sportType === "run" || activity.sportType === "treadmill"
        ? calculateActivityBestEfforts({
            distanceSamples: inputs.distanceSamples,
            elapsedTimeSamples: inputs.elapsedTimeSamples,
          })
        : [];

    await db.transaction(async (tx) => {
      const affectedDistanceCodes = await replaceActivityBestEfforts({
        activityId: job.activityId,
        activityStartAt: activity.activityStartAt,
        database: tx,
        efforts,
        sportType: activity.sportType,
        userId: activity.userId,
      });

      await refreshPersonalBestEfforts({
        database: tx,
        standardDistanceCodes: affectedDistanceCodes,
        userId: activity.userId,
      });
    });

    await markActivityBestEffortCalculationSucceeded({ jobId: job.id });
  } catch (error) {
    await markActivityBestEffortCalculationFailed({
      error: error instanceof Error ? error.message : "Unknown error",
      jobId: job.id,
    });
  }
}
