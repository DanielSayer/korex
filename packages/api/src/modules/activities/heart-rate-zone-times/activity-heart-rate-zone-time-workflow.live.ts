import { db } from "@korex/db";
import { Effect, Layer } from "effect";
import { replaceActivityStreams } from "../artifacts/activity-artifacts.repository";
import { enqueueActivityBestEffortCalculation } from "../best-efforts/activity-best-effort-jobs.repository";
import {
  clearActivityHeartRateZoneCalculation,
  clearActivityHeartRateZoneTimes,
  listUserHeartRateZoneSnapshots,
  replaceActivityHeartRateZoneSnapshots,
} from "./activity-heart-rate-zone-time.repository";
import {
  deleteActivityHeartRateZoneTimeCalculationJob,
  enqueueActivityHeartRateZoneTimeCalculation,
} from "./activity-heart-rate-zone-time-jobs.repository";
import { ActivityHeartRateZoneTimeWorkflow } from "./activity-heart-rate-zone-time-workflow.dependencies";

export const ActivityHeartRateZoneTimeWorkflowLive = Layer.succeed(
  ActivityHeartRateZoneTimeWorkflow,
  {
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
