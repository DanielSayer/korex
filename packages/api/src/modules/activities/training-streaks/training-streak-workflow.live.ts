import { Effect, Layer } from "effect";
import {
  TimeProvider,
  TimeProviderLive,
} from "../../time-provider.dependencies";
import {
  getTrainingStreakProjectionInputs,
  upsertTrainingStreak,
} from "./training-streak.repository";
import {
  claimTrainingStreakUpdateJobs,
  markTrainingStreakUpdateFailed,
  markTrainingStreakUpdateSucceeded,
} from "./training-streak-jobs.repository";
import {
  TrainingStreakJobRepository,
  TrainingStreakRepository,
  TrainingStreakWorkflow,
} from "./training-streak-workflow.dependencies";
import { getPreviousTrainingWeekStartAt } from "./training-streaks";

export const TrainingStreakRepositoryLive = Layer.succeed(
  TrainingStreakRepository,
  {
    getTrainingStreakProjectionInputs,
    upsertTrainingStreak,
  },
);

export const TrainingStreakJobRepositoryLive = Layer.succeed(
  TrainingStreakJobRepository,
  {
    claimTrainingStreakUpdateJobs,
    markTrainingStreakUpdateFailed,
    markTrainingStreakUpdateSucceeded,
  },
);

export const TrainingStreakWorkflowLayer = Layer.effect(
  TrainingStreakWorkflow,
  Effect.gen(function* () {
    const streakRepository = yield* TrainingStreakRepository;
    const jobRepository = yield* TrainingStreakJobRepository;
    const timeProvider = yield* TimeProvider;

    const processTrainingStreakUpdateJob = async (job: {
      id: number;
      userId: string;
      weekStartAt: Date;
    }) => {
      try {
        const inputs = await streakRepository.getTrainingStreakProjectionInputs(
          {
            userId: job.userId,
            weekStartAt: job.weekStartAt,
          },
        );

        const lastQualifiedWeekStartAt =
          inputs.streak?.lastQualifiedWeekStartAt ?? null;

        if (
          lastQualifiedWeekStartAt &&
          lastQualifiedWeekStartAt.getTime() > job.weekStartAt.getTime()
        ) {
          await jobRepository.markTrainingStreakUpdateSucceeded({
            jobId: job.id,
            now: timeProvider.now(),
          });
          return;
        }

        if (!inputs.hasQualifyingActivity && inputs.streak?.currentStreak) {
          await streakRepository.upsertTrainingStreak({
            currentStreak: 0,
            lastQualifiedWeekStartAt: null,
            maxStreak: inputs.streak?.maxStreak ?? 0,
            userId: job.userId,
          });
        } else if (
          inputs.hasQualifyingActivity &&
          lastQualifiedWeekStartAt?.getTime() !== job.weekStartAt.getTime()
        ) {
          const previousWeekStartAt = getPreviousTrainingWeekStartAt(
            job.weekStartAt,
          );
          const previousCurrentStreak = inputs.streak?.currentStreak ?? 0;
          const currentStreak =
            lastQualifiedWeekStartAt?.getTime() ===
            previousWeekStartAt.getTime()
              ? previousCurrentStreak + 1
              : 1;

          await streakRepository.upsertTrainingStreak({
            currentStreak,
            lastQualifiedWeekStartAt: job.weekStartAt,
            maxStreak: Math.max(currentStreak, inputs.streak?.maxStreak ?? 0),
            userId: job.userId,
          });
        }

        await jobRepository.markTrainingStreakUpdateSucceeded({
          jobId: job.id,
          now: timeProvider.now(),
        });
      } catch (error) {
        await jobRepository.markTrainingStreakUpdateFailed({
          error: error instanceof Error ? error.message : "Unknown error",
          jobId: job.id,
          now: timeProvider.now(),
        });
      }
    };

    return {
      processTrainingStreakUpdateJob: (job) =>
        Effect.promise(() => processTrainingStreakUpdateJob(job)),
      runTrainingStreakWorkerOnce: ({
        batchSize,
        now = timeProvider.now(),
        staleLockMs,
        workerId,
      }) =>
        Effect.promise(async () => {
          const jobs = await jobRepository.claimTrainingStreakUpdateJobs({
            batchSize,
            now,
            staleLockedBefore: new Date(now.getTime() - staleLockMs),
            workerId,
          });

          for (const job of jobs) {
            await processTrainingStreakUpdateJob(job);
          }

          return {
            processed: jobs.length,
          };
        }),
    };
  }),
);

export const TrainingStreakWorkflowLive = TrainingStreakWorkflowLayer.pipe(
  Layer.provide(
    Layer.mergeAll(
      TimeProviderLive,
      TrainingStreakJobRepositoryLive,
      TrainingStreakRepositoryLive,
    ),
  ),
);
