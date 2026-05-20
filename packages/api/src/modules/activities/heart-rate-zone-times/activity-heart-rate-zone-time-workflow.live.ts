import { db } from "@korex/db";
import { Effect, Layer } from "effect";
import { replaceActivityStreams } from "../artifacts/activity-artifacts.repository";
import { enqueueActivityBestEffortCalculation } from "../best-efforts/activity-best-effort-jobs.repository";
import {
  clearActivityHeartRateZoneCalculation,
  clearActivityHeartRateZoneTimes,
  getActivityHeartRateZoneCalculationInputs,
  listUserHeartRateZoneSnapshots,
  replaceActivityHeartRateZoneSnapshots,
  replaceActivityHeartRateZoneTimes,
} from "./activity-heart-rate-zone-time.repository";
import {
  type ActivityHeartRateZoneTimeCalculationJob,
  claimActivityHeartRateZoneTimeCalculationJobs,
  deleteActivityHeartRateZoneTimeCalculationJob,
  enqueueActivityHeartRateZoneTimeCalculation,
  markActivityHeartRateZoneTimeCalculationFailed,
  markActivityHeartRateZoneTimeCalculationSucceeded,
} from "./activity-heart-rate-zone-time-jobs.repository";
import { ActivityHeartRateZoneTimeWorkflow } from "./activity-heart-rate-zone-time-workflow.dependencies";
import { calculateActivityHeartRateZoneTimes } from "./activity-heart-rate-zone-times";

export const ActivityHeartRateZoneTimeWorkflowLive = Layer.succeed(
  ActivityHeartRateZoneTimeWorkflow,
  {
    processActivityHeartRateZoneTimeCalculationJob: (job) =>
      Effect.promise(() => processActivityHeartRateZoneTimeCalculationJob(job)),
    replaceActivityHeartRateZoneSnapshotsAndQueueCalculation: ({
      activityId,
      snapshots,
    }) =>
      Effect.promise(() =>
        db.transaction(async (tx) => {
          await replaceActivityHeartRateZoneSnapshots({
            activityId,
            database: tx,
            snapshots,
          });

          await resetActivityHeartRateZoneTimeCalculation({
            activityId,
            database: tx,
          });
        }),
      ),
    replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation: ({
      activityId,
      streams,
      userId,
    }) =>
      Effect.promise(() =>
        db.transaction(async (tx) => {
          await replaceActivityStreams({
            activityId,
            database: tx,
            streams,
          });
          await enqueueActivityBestEffortCalculation({
            activityId,
            database: tx,
          });

          const hasHeartRateStream = streams.some(
            (stream) => stream.streamType === "heartRate",
          );

          if (!hasHeartRateStream) {
            await clearActivityHeartRateZoneCalculation({
              activityId,
              database: tx,
            });
            await deleteActivityHeartRateZoneTimeCalculationJob({
              activityId,
              database: tx,
            });
            return;
          }

          const snapshots = await listUserHeartRateZoneSnapshots({
            database: tx,
            userId,
          });

          if (snapshots.length === 0) {
            await clearActivityHeartRateZoneCalculation({
              activityId,
              database: tx,
            });
            await deleteActivityHeartRateZoneTimeCalculationJob({
              activityId,
              database: tx,
            });
            return;
          }

          await replaceActivityHeartRateZoneSnapshots({
            activityId,
            database: tx,
            snapshots,
          });

          await resetActivityHeartRateZoneTimeCalculation({
            activityId,
            database: tx,
          });
        }),
      ),
    runActivityHeartRateZoneTimeWorkerOnce: ({
      batchSize,
      now = new Date(),
      staleLockMs,
      workerId,
    }) =>
      Effect.promise(async () => {
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
      }),
  },
);

type WorkflowDatabase = Parameters<
  typeof replaceActivityHeartRateZoneSnapshots
>[0]["database"];

async function resetActivityHeartRateZoneTimeCalculation({
  activityId,
  database,
}: {
  activityId: number;
  database: NonNullable<WorkflowDatabase>;
}) {
  await clearActivityHeartRateZoneTimes({
    activityId,
    database,
  });
  await enqueueActivityHeartRateZoneTimeCalculation({
    activityId,
    database,
  });
}

async function processActivityHeartRateZoneTimeCalculationJob(
  job: ActivityHeartRateZoneTimeCalculationJob,
) {
  try {
    const inputs = await getActivityHeartRateZoneCalculationInputs({
      activityId: job.activityId,
    });

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

    await replaceActivityHeartRateZoneTimes({
      activityId: job.activityId,
      times,
    });
    await markActivityHeartRateZoneTimeCalculationSucceeded({
      jobId: job.id,
    });
  } catch (error) {
    await markActivityHeartRateZoneTimeCalculationFailed({
      error: error instanceof Error ? error.message : "Unknown error",
      jobId: job.id,
    });
  }
}
