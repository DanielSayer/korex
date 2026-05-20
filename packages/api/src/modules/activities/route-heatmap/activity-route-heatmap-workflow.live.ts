import { Effect, Layer } from "effect";
import {
  TimeProvider,
  TimeProviderLive,
} from "../../time-provider.dependencies";
import { calculateActivityRouteHeatmapContributions } from "./activity-route-heatmap";
import {
  clearActivityRouteHeatmapContributions,
  getActivityRouteHeatmapCalculationInputs,
  replaceActivityRouteHeatmapContributions,
} from "./activity-route-heatmap.repository";
import {
  claimActivityRouteHeatmapCalculationJobs,
  markActivityRouteHeatmapCalculationFailed,
  markActivityRouteHeatmapCalculationSucceeded,
} from "./activity-route-heatmap-jobs.repository";
import {
  ActivityRouteHeatmapJobRepository,
  ActivityRouteHeatmapProjectionRepository,
  ActivityRouteHeatmapWorkflow,
} from "./activity-route-heatmap-workflow.dependencies";

export const ActivityRouteHeatmapProjectionRepositoryLive = Layer.succeed(
  ActivityRouteHeatmapProjectionRepository,
  {
    clearActivityRouteHeatmapContributions,
    getActivityRouteHeatmapCalculationInputs,
    replaceActivityRouteHeatmapContributions,
  },
);

export const ActivityRouteHeatmapJobRepositoryLive = Layer.succeed(
  ActivityRouteHeatmapJobRepository,
  {
    claimActivityRouteHeatmapCalculationJobs,
    markActivityRouteHeatmapCalculationFailed,
    markActivityRouteHeatmapCalculationSucceeded,
  },
);

export const ActivityRouteHeatmapWorkflowLayer = Layer.effect(
  ActivityRouteHeatmapWorkflow,
  Effect.gen(function* () {
    const projectionRepository =
      yield* ActivityRouteHeatmapProjectionRepository;
    const jobRepository = yield* ActivityRouteHeatmapJobRepository;
    const timeProvider = yield* TimeProvider;

    const processActivityRouteHeatmapCalculationJob = async (job: {
      activityId: number;
      id: number;
    }) => {
      try {
        const inputs =
          await projectionRepository.getActivityRouteHeatmapCalculationInputs({
            activityId: job.activityId,
          });

        if (!inputs?.qualifies) {
          await projectionRepository.clearActivityRouteHeatmapContributions({
            activityId: job.activityId,
          });
          await jobRepository.markActivityRouteHeatmapCalculationSucceeded({
            jobId: job.id,
            now: timeProvider.now(),
          });
          return;
        }

        const contributions = calculateActivityRouteHeatmapContributions({
          coordinates: inputs.coordinates,
        });

        await projectionRepository.replaceActivityRouteHeatmapContributions({
          activityId: inputs.activityId,
          activityStartAt: inputs.activityStartAt,
          contributions,
          userId: inputs.userId,
        });
        await jobRepository.markActivityRouteHeatmapCalculationSucceeded({
          jobId: job.id,
          now: timeProvider.now(),
        });
      } catch (error) {
        await jobRepository.markActivityRouteHeatmapCalculationFailed({
          error: error instanceof Error ? error.message : "Unknown error",
          jobId: job.id,
          now: timeProvider.now(),
        });
      }
    };

    return {
      processActivityRouteHeatmapCalculationJob: (job) =>
        Effect.promise(() => processActivityRouteHeatmapCalculationJob(job)),
      runActivityRouteHeatmapWorkerOnce: ({
        batchSize,
        now = timeProvider.now(),
        staleLockMs,
        workerId,
      }) =>
        Effect.promise(async () => {
          const jobs =
            await jobRepository.claimActivityRouteHeatmapCalculationJobs({
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
    };
  }),
);

export const ActivityRouteHeatmapWorkflowLive =
  ActivityRouteHeatmapWorkflowLayer.pipe(
    Layer.provide(
      Layer.mergeAll(
        ActivityRouteHeatmapJobRepositoryLive,
        ActivityRouteHeatmapProjectionRepositoryLive,
        TimeProviderLive,
      ),
    ),
  );
