import { db } from "@korex/db";
import { Effect, Layer } from "effect";
import {
  TimeProvider,
  TimeProviderLive,
} from "../../time-provider.dependencies";
import {
  getActivityBestEffortCalculationInputs,
  refreshPersonalBestEfforts,
  replaceActivityBestEfforts,
} from "./activity-best-effort.repository";
import {
  claimActivityBestEffortCalculationJobs,
  markActivityBestEffortCalculationFailed,
  markActivityBestEffortCalculationSucceeded,
} from "./activity-best-effort-jobs.repository";
import {
  type ActivityBestEffortDatabase,
  ActivityBestEffortJobRepository,
  ActivityBestEffortRepository,
  ActivityBestEffortWorkflow,
} from "./activity-best-effort-workflow.dependencies";
import { calculateActivityBestEfforts } from "./activity-best-efforts";

export const ActivityBestEffortRepositoryLive = Layer.succeed(
  ActivityBestEffortRepository,
  {
    getActivityBestEffortCalculationInputs,
    refreshPersonalBestEfforts,
    replaceActivityBestEfforts,
    transaction: (work) =>
      db.transaction((tx) => work(tx as ActivityBestEffortDatabase)),
  },
);

export const ActivityBestEffortJobRepositoryLive = Layer.succeed(
  ActivityBestEffortJobRepository,
  {
    claimActivityBestEffortCalculationJobs,
    markActivityBestEffortCalculationFailed,
    markActivityBestEffortCalculationSucceeded,
  },
);

export const ActivityBestEffortWorkflowLayer = Layer.effect(
  ActivityBestEffortWorkflow,
  Effect.gen(function* () {
    const bestEffortRepository = yield* ActivityBestEffortRepository;
    const jobRepository = yield* ActivityBestEffortJobRepository;
    const timeProvider = yield* TimeProvider;

    const processActivityBestEffortCalculationJob = async (job: {
      activityId: number;
      id: number;
    }) => {
      try {
        const inputs =
          await bestEffortRepository.getActivityBestEffortCalculationInputs({
            activityId: job.activityId,
          });

        if (!inputs.activity) {
          await jobRepository.markActivityBestEffortCalculationSucceeded({
            jobId: job.id,
            now: timeProvider.now(),
          });
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

        await bestEffortRepository.transaction(async (database) => {
          const affectedDistanceCodes =
            await bestEffortRepository.replaceActivityBestEfforts({
              activityId: job.activityId,
              activityStartAt: activity.activityStartAt,
              database,
              efforts,
              sportType: activity.sportType,
              userId: activity.userId,
            });

          await bestEffortRepository.refreshPersonalBestEfforts({
            database,
            standardDistanceCodes: affectedDistanceCodes,
            userId: activity.userId,
          });
        });

        await jobRepository.markActivityBestEffortCalculationSucceeded({
          jobId: job.id,
          now: timeProvider.now(),
        });
      } catch (error) {
        await jobRepository.markActivityBestEffortCalculationFailed({
          error: error instanceof Error ? error.message : "Unknown error",
          jobId: job.id,
          now: timeProvider.now(),
        });
      }
    };

    return {
      processActivityBestEffortCalculationJob: (job) =>
        Effect.promise(() => processActivityBestEffortCalculationJob(job)),
      runActivityBestEffortWorkerOnce: ({
        batchSize,
        now = timeProvider.now(),
        staleLockMs,
        workerId,
      }) =>
        Effect.promise(async () => {
          const jobs =
            await jobRepository.claimActivityBestEffortCalculationJobs({
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
    };
  }),
);

export const ActivityBestEffortWorkflowLive =
  ActivityBestEffortWorkflowLayer.pipe(
    Layer.provide(
      Layer.mergeAll(
        ActivityBestEffortJobRepositoryLive,
        ActivityBestEffortRepositoryLive,
        TimeProviderLive,
      ),
    ),
  );
