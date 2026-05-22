import { Effect, Layer } from "effect";
import {
  TimeProvider,
  TimeProviderLive,
} from "../../time-provider.dependencies";
import {
  getCompletedTrainingWeek,
  getPreviousTrainingWeekStartAt,
} from "./training-week";
import {
  listActivitiesForTrainingWeek,
  upsertWeeklyTrainingSummary,
  type WeeklyTrainingSummaryActivity,
} from "./weekly-training-summary.repository";
import {
  claimWeeklyTrainingSummaryGenerationJobs,
  enqueueWeeklyTrainingSummaryGeneration,
  getTrainingWeekEndAt,
  listUsersWithActivitiesForTrainingWeek,
  markWeeklyTrainingSummaryGenerationFailed,
  markWeeklyTrainingSummaryGenerationSucceeded,
} from "./weekly-training-summary-jobs.repository";
import {
  WeeklyTrainingSummaryJobRepository,
  WeeklyTrainingSummaryRepository,
  WeeklyTrainingSummaryWorkflow,
} from "./weekly-training-summary-workflow.dependencies";

export const WeeklyTrainingSummaryRepositoryLive = Layer.succeed(
  WeeklyTrainingSummaryRepository,
  {
    listActivitiesForTrainingWeek,
    upsertWeeklyTrainingSummary,
  },
);

export const WeeklyTrainingSummaryJobRepositoryLive = Layer.succeed(
  WeeklyTrainingSummaryJobRepository,
  {
    claimWeeklyTrainingSummaryGenerationJobs,
    enqueueWeeklyTrainingSummaryGeneration,
    getTrainingWeekEndAt,
    listUsersWithActivitiesForTrainingWeek,
    markWeeklyTrainingSummaryGenerationFailed,
    markWeeklyTrainingSummaryGenerationSucceeded,
  },
);

export const WeeklyTrainingSummaryWorkflowLayer = Layer.effect(
  WeeklyTrainingSummaryWorkflow,
  Effect.gen(function* () {
    const summaryRepository = yield* WeeklyTrainingSummaryRepository;
    const jobRepository = yield* WeeklyTrainingSummaryJobRepository;
    const timeProvider = yield* TimeProvider;

    const processWeeklyTrainingSummaryGenerationJob = async (job: {
      id: number;
      userId: string;
      weekStartAt: Date;
    }) => {
      try {
        const weekEndAt = jobRepository.getTrainingWeekEndAt(job.weekStartAt);
        const previousWeekStartAt = getPreviousTrainingWeekStartAt(
          job.weekStartAt,
        );

        const [currentActivities, previousActivities] = await Promise.all([
          summaryRepository.listActivitiesForTrainingWeek({
            userId: job.userId,
            weekEndAt,
            weekStartAt: job.weekStartAt,
          }),
          summaryRepository.listActivitiesForTrainingWeek({
            userId: job.userId,
            weekEndAt: job.weekStartAt,
            weekStartAt: previousWeekStartAt,
          }),
        ]);

        if (currentActivities.length === 0) {
          throw new Error(
            "Weekly Training Summary requires at least one Activity",
          );
        }

        const currentTotals = summarizeActivities(currentActivities);
        const previousTotals = summarizeActivities(previousActivities);
        const longestActivity = findLongestActivity(currentActivities);
        const averageSpeedDelta =
          currentTotals.averageSpeedMetersPerSecond === null ||
          previousTotals.averageSpeedMetersPerSecond === null
            ? null
            : currentTotals.averageSpeedMetersPerSecond -
              previousTotals.averageSpeedMetersPerSecond;

        await summaryRepository.upsertWeeklyTrainingSummary({
          activityCount: currentTotals.activityCount,
          averageSpeedMetersPerSecond:
            currentTotals.averageSpeedMetersPerSecond,
          generatedAt: timeProvider.now(),
          longestActivityId: longestActivity?.id ?? null,
          payload: {
            highlights: {
              longestActivity: longestActivity
                ? {
                    distanceMeters: longestActivity.distanceMeters,
                    id: longestActivity.id,
                    name: longestActivity.name,
                    startAt: longestActivity.startAt.toISOString(),
                  }
                : null,
            },
            previousWeek: {
              activityCount: previousTotals.activityCount,
              averageSpeedMetersPerSecond:
                previousTotals.averageSpeedMetersPerSecond,
              totalDistanceMeters: previousTotals.totalDistanceMeters,
              totalMovingTimeSeconds: previousTotals.totalMovingTimeSeconds,
              weekStartAt: previousWeekStartAt.toISOString(),
            },
          },
          previousWeekActivityCountDelta:
            currentTotals.activityCount - previousTotals.activityCount,
          previousWeekAverageSpeedDeltaMetersPerSecond: averageSpeedDelta,
          previousWeekDistanceDeltaMeters:
            currentTotals.totalDistanceMeters -
            previousTotals.totalDistanceMeters,
          previousWeekMovingTimeDeltaSeconds:
            currentTotals.totalMovingTimeSeconds -
            previousTotals.totalMovingTimeSeconds,
          totalDistanceMeters: currentTotals.totalDistanceMeters,
          totalMovingTimeSeconds: currentTotals.totalMovingTimeSeconds,
          userId: job.userId,
          weekEndAt,
          weekStartAt: job.weekStartAt,
        });
        await jobRepository.markWeeklyTrainingSummaryGenerationSucceeded({
          jobId: job.id,
          now: timeProvider.now(),
        });
      } catch (error) {
        await jobRepository.markWeeklyTrainingSummaryGenerationFailed({
          error: error instanceof Error ? error.message : "Unknown error",
          jobId: job.id,
          now: timeProvider.now(),
        });
      }
    };

    return {
      enqueueCompletedWeeklyTrainingSummaries: ({
        now = timeProvider.now(),
        skipSucceeded = false,
      } = {}) =>
        Effect.promise(async () => {
          const { weekEndAt, weekStartAt } = getCompletedTrainingWeek(now);
          const userIds =
            await jobRepository.listUsersWithActivitiesForTrainingWeek({
              skipSucceeded,
              weekEndAt,
              weekStartAt,
            });

          for (const userId of userIds) {
            await jobRepository.enqueueWeeklyTrainingSummaryGeneration({
              userId,
              weekStartAt,
            });
          }

          return {
            enqueued: userIds.length,
            weekEndAt,
            weekStartAt,
          };
        }),
      processWeeklyTrainingSummaryGenerationJob: (job) =>
        Effect.promise(() => processWeeklyTrainingSummaryGenerationJob(job)),
      runWeeklyTrainingSummaryWorkerOnce: ({
        batchSize,
        now = timeProvider.now(),
        staleLockMs,
        workerId,
      }) =>
        Effect.promise(async () => {
          const jobs =
            await jobRepository.claimWeeklyTrainingSummaryGenerationJobs({
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
        }),
    };
  }),
);

export const WeeklyTrainingSummaryWorkflowLive =
  WeeklyTrainingSummaryWorkflowLayer.pipe(
    Layer.provide(
      Layer.mergeAll(
        TimeProviderLive,
        WeeklyTrainingSummaryJobRepositoryLive,
        WeeklyTrainingSummaryRepositoryLive,
      ),
    ),
  );

function summarizeActivities(activities: WeeklyTrainingSummaryActivity[]) {
  const totalDistanceMeters = activities.reduce(
    (sum, activity) => sum + (activity.distanceMeters ?? 0),
    0,
  );
  const totalMovingTimeSeconds = activities.reduce(
    (sum, activity) => sum + (activity.movingTimeSeconds ?? 0),
    0,
  );

  return {
    activityCount: activities.length,
    averageSpeedMetersPerSecond:
      totalMovingTimeSeconds === 0
        ? null
        : totalDistanceMeters / totalMovingTimeSeconds,
    totalDistanceMeters,
    totalMovingTimeSeconds,
  };
}

function findLongestActivity(activities: WeeklyTrainingSummaryActivity[]) {
  return activities.reduce<WeeklyTrainingSummaryActivity | null>(
    (longest, activity) => {
      if (!longest) {
        return activity;
      }

      return (activity.distanceMeters ?? 0) > (longest.distanceMeters ?? 0)
        ? activity
        : longest;
    },
    null,
  );
}
