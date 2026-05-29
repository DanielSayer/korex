import { db } from "@korex/db";
import { Effect, Layer } from "effect";
import {
  TimeProvider,
  TimeProviderLive,
} from "../../time-provider.dependencies";
import {
  clearActivityHeartRateZoneTimes,
  getActivityHeartRateZoneCalculationInputs,
  replaceActivityHeartRateZoneSnapshots,
  replaceActivityHeartRateZoneTimes,
} from "./activity-heart-rate-zone-time.repository";
import {
  claimActivityHeartRateZoneTimeCalculationJobs,
  enqueueActivityHeartRateZoneTimeCalculation,
  markActivityHeartRateZoneTimeCalculationFailed,
  markActivityHeartRateZoneTimeCalculationSucceeded,
} from "./activity-heart-rate-zone-time-jobs.repository";
import {
  type ActivityHeartRateZoneTimeDatabase,
  ActivityHeartRateZoneTimeWorkflow,
  HeartRateZoneSnapshotRepository,
  HeartRateZoneTimeJobRepository,
} from "./activity-heart-rate-zone-time-workflow.dependencies";
import { calculateActivityHeartRateZoneTimes } from "./activity-heart-rate-zone-times";

export const HeartRateZoneSnapshotRepositoryLive = Layer.succeed(
  HeartRateZoneSnapshotRepository,
  {
    clearActivityHeartRateZoneTimes,
    getActivityHeartRateZoneCalculationInputs,
    replaceActivityHeartRateZoneSnapshots,
    replaceActivityHeartRateZoneTimes,
    transaction: (work) =>
      db.transaction((tx) => work(tx as ActivityHeartRateZoneTimeDatabase)),
  },
);

export const HeartRateZoneTimeJobRepositoryLive = Layer.succeed(
  HeartRateZoneTimeJobRepository,
  {
    claimActivityHeartRateZoneTimeCalculationJobs,
    enqueueActivityHeartRateZoneTimeCalculation,
    markActivityHeartRateZoneTimeCalculationFailed,
    markActivityHeartRateZoneTimeCalculationSucceeded,
  },
);

export const ActivityHeartRateZoneTimeWorkflowLayer = Layer.effect(
  ActivityHeartRateZoneTimeWorkflow,
  Effect.gen(function* () {
    const heartRateZoneRepository = yield* HeartRateZoneSnapshotRepository;
    const jobRepository = yield* HeartRateZoneTimeJobRepository;
    const timeProvider = yield* TimeProvider;

    const resetActivityHeartRateZoneTimeCalculation = ({
      activityId,
      database,
    }: {
      activityId: number;
      database: ActivityHeartRateZoneTimeDatabase;
    }) =>
      heartRateZoneRepository
        .clearActivityHeartRateZoneTimes({
          activityId,
          database,
        })
        .then(() =>
          jobRepository.enqueueActivityHeartRateZoneTimeCalculation({
            activityId,
            database,
          }),
        );

    const processActivityHeartRateZoneTimeCalculationJob = async (job: {
      activityId: number;
      id: number;
    }) => {
      try {
        const inputs =
          await heartRateZoneRepository.getActivityHeartRateZoneCalculationInputs(
            {
              activityId: job.activityId,
            },
          );

        if (inputs.movingTimeSeconds === null) {
          throw new Error("Activity moving time is required");
        }

        if (inputs.heartRateSamples.length === 0) {
          throw new Error("Activity heart-rate stream is required");
        }

        if (inputs.snapshots.length === 0) {
          throw new Error("Activity heart-rate zone snapshots are required");
        }

        const times = calculateActivityHeartRateZoneTimes(inputs);

        await heartRateZoneRepository.replaceActivityHeartRateZoneTimes({
          activityId: job.activityId,
          times,
        });
        await jobRepository.markActivityHeartRateZoneTimeCalculationSucceeded({
          jobId: job.id,
          now: timeProvider.now(),
        });
      } catch (error) {
        await jobRepository.markActivityHeartRateZoneTimeCalculationFailed({
          error: error instanceof Error ? error.message : "Unknown error",
          jobId: job.id,
          now: timeProvider.now(),
        });
      }
    };

    return {
      processActivityHeartRateZoneTimeCalculationJob: (job) =>
        Effect.promise(() =>
          processActivityHeartRateZoneTimeCalculationJob(job),
        ),
      replaceActivityHeartRateZoneSnapshotsAndQueueCalculation: ({
        activityId,
        snapshots,
      }) =>
        Effect.promise(() =>
          heartRateZoneRepository.transaction(async (database) => {
            await heartRateZoneRepository.replaceActivityHeartRateZoneSnapshots(
              {
                activityId,
                database,
                snapshots,
              },
            );

            await resetActivityHeartRateZoneTimeCalculation({
              activityId,
              database,
            });
          }),
        ),
      runActivityHeartRateZoneTimeWorkerOnce: ({
        batchSize,
        now = timeProvider.now(),
        staleLockMs,
        workerId,
      }) =>
        Effect.promise(async () => {
          const jobs =
            await jobRepository.claimActivityHeartRateZoneTimeCalculationJobs({
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
        }),
    };
  }),
);

export const ActivityHeartRateZoneTimeWorkflowLive =
  ActivityHeartRateZoneTimeWorkflowLayer.pipe(
    Layer.provide(
      Layer.mergeAll(
        HeartRateZoneSnapshotRepositoryLive,
        HeartRateZoneTimeJobRepositoryLive,
        TimeProviderLive,
      ),
    ),
  );
