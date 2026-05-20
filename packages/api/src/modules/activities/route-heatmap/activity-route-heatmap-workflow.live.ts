import { Effect, Layer } from "effect";
import { calculateActivityRouteHeatmapContributions } from "./activity-route-heatmap";
import {
  clearActivityRouteHeatmapContributions,
  getActivityRouteHeatmapCalculationInputs,
  replaceActivityRouteHeatmapContributions,
} from "./activity-route-heatmap.repository";
import {
  type ActivityRouteHeatmapCalculationJob,
  claimActivityRouteHeatmapCalculationJobs,
  markActivityRouteHeatmapCalculationFailed,
  markActivityRouteHeatmapCalculationSucceeded,
} from "./activity-route-heatmap-jobs.repository";
import { ActivityRouteHeatmapWorkflow } from "./activity-route-heatmap-workflow.dependencies";

export const ActivityRouteHeatmapWorkflowLive = Layer.succeed(
  ActivityRouteHeatmapWorkflow,
  {
    processActivityRouteHeatmapCalculationJob: (job) =>
      Effect.promise(() => processActivityRouteHeatmapCalculationJob(job)),
    runActivityRouteHeatmapWorkerOnce: ({
      batchSize,
      now = new Date(),
      staleLockMs,
      workerId,
    }) =>
      Effect.promise(async () => {
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
      }),
  },
);

async function processActivityRouteHeatmapCalculationJob(
  job: ActivityRouteHeatmapCalculationJob,
) {
  try {
    const inputs = await getActivityRouteHeatmapCalculationInputs({
      activityId: job.activityId,
    });

    if (!inputs?.qualifies) {
      await clearActivityRouteHeatmapContributions({
        activityId: job.activityId,
      });
      await markActivityRouteHeatmapCalculationSucceeded({
        jobId: job.id,
      });
      return;
    }

    const contributions = calculateActivityRouteHeatmapContributions({
      coordinates: inputs.coordinates,
    });

    await replaceActivityRouteHeatmapContributions({
      activityId: inputs.activityId,
      activityStartAt: inputs.activityStartAt,
      contributions,
      userId: inputs.userId,
    });
    await markActivityRouteHeatmapCalculationSucceeded({
      jobId: job.id,
    });
  } catch (error) {
    await markActivityRouteHeatmapCalculationFailed({
      error: error instanceof Error ? error.message : "Unknown error",
      jobId: job.id,
    });
  }
}
