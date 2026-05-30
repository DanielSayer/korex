import { db } from "@korex/db";
import { Effect, Layer } from "effect";
import type { ActivityStreamInput } from "../activities.types";
import { replaceActivityStreams } from "../artifacts/activity-artifacts.repository";
import { enqueueActivityBestEffortCalculation } from "../best-efforts/activity-best-effort-jobs.repository";
import {
  clearActivityHeartRateZoneCalculation,
  clearActivityHeartRateZoneTimes,
  listUserHeartRateZoneSnapshots,
  replaceActivityHeartRateZoneSnapshots,
} from "../heart-rate-zone-times/activity-heart-rate-zone-time.repository";
import {
  deleteActivityHeartRateZoneTimeCalculationJob,
  enqueueActivityHeartRateZoneTimeCalculation,
} from "../heart-rate-zone-times/activity-heart-rate-zone-time-jobs.repository";
import {
  ActivityBestEffortJobRepository,
  type ActivityStreamReplacementDatabase,
  ActivityStreamReplacementWorkflow,
  ActivityStreamsRepository,
  HeartRateZoneSnapshotRepository,
  HeartRateZoneTimeJobRepository,
} from "./activity-stream-replacement.dependencies";

type HeartRateZoneInvalidationDecision =
  | { type: "clearCalculation" }
  | {
      snapshots: Parameters<
        typeof replaceActivityHeartRateZoneSnapshots
      >[0]["snapshots"];
      type: "queueCalculation";
    };

export const ActivityStreamsRepositoryLive = Layer.succeed(
  ActivityStreamsRepository,
  {
    replaceActivityStreams,
  },
);

export const ActivityBestEffortJobRepositoryLive = Layer.succeed(
  ActivityBestEffortJobRepository,
  {
    enqueueActivityBestEffortCalculation,
  },
);

export const HeartRateZoneSnapshotRepositoryLive = Layer.succeed(
  HeartRateZoneSnapshotRepository,
  {
    clearActivityHeartRateZoneCalculation,
    clearActivityHeartRateZoneTimes,
    listUserHeartRateZoneSnapshots,
    replaceActivityHeartRateZoneSnapshots,
    transaction: (work) =>
      db.transaction((tx) => work(tx as ActivityStreamReplacementDatabase)),
  },
);

export const HeartRateZoneTimeJobRepositoryLive = Layer.succeed(
  HeartRateZoneTimeJobRepository,
  {
    deleteActivityHeartRateZoneTimeCalculationJob,
    enqueueActivityHeartRateZoneTimeCalculation,
  },
);

export const ActivityStreamReplacementWorkflowLayer = Layer.effect(
  ActivityStreamReplacementWorkflow,
  Effect.gen(function* () {
    const activityStreamsRepository = yield* ActivityStreamsRepository;
    const bestEffortJobRepository = yield* ActivityBestEffortJobRepository;
    const heartRateZoneRepository = yield* HeartRateZoneSnapshotRepository;
    const jobRepository = yield* HeartRateZoneTimeJobRepository;

    const resetActivityHeartRateZoneTimeCalculation = ({
      activityId,
      database,
    }: {
      activityId: number;
      database: ActivityStreamReplacementDatabase;
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

    const clearActivityHeartRateZoneTimeCalculation = ({
      activityId,
      database,
    }: {
      activityId: number;
      database: ActivityStreamReplacementDatabase;
    }) =>
      heartRateZoneRepository
        .clearActivityHeartRateZoneCalculation({
          activityId,
          database,
        })
        .then(() =>
          jobRepository.deleteActivityHeartRateZoneTimeCalculationJob({
            activityId,
            database,
          }),
        );

    const planHeartRateZoneInvalidation = async ({
      database,
      streams,
      userId,
    }: {
      database: ActivityStreamReplacementDatabase;
      streams: ActivityStreamInput[];
      userId: string;
    }): Promise<HeartRateZoneInvalidationDecision> => {
      const hasHeartRateStream = streams.some(
        (stream) => stream.streamType === "heartRate",
      );

      if (!hasHeartRateStream) {
        return { type: "clearCalculation" };
      }

      const snapshots =
        await heartRateZoneRepository.listUserHeartRateZoneSnapshots({
          database,
          userId,
        });

      if (snapshots.length === 0) {
        return { type: "clearCalculation" };
      }

      return { snapshots, type: "queueCalculation" };
    };

    return {
      replaceActivityStreamsAndInvalidateDerivedData: ({
        activityId,
        streams,
        userId,
      }) =>
        Effect.promise(() =>
          heartRateZoneRepository.transaction(async (database) => {
            await activityStreamsRepository.replaceActivityStreams({
              activityId,
              database,
              streams,
            });
            await bestEffortJobRepository.enqueueActivityBestEffortCalculation({
              activityId,
              database,
            });

            const decision = await planHeartRateZoneInvalidation({
              database,
              streams,
              userId,
            });

            if (decision.type === "clearCalculation") {
              await clearActivityHeartRateZoneTimeCalculation({
                activityId,
                database,
              });
              return;
            }

            await heartRateZoneRepository.replaceActivityHeartRateZoneSnapshots(
              {
                activityId,
                database,
                snapshots: decision.snapshots,
              },
            );

            await resetActivityHeartRateZoneTimeCalculation({
              activityId,
              database,
            });
          }),
        ),
    };
  }),
);

export const ActivityStreamReplacementWorkflowLive =
  ActivityStreamReplacementWorkflowLayer.pipe(
    Layer.provide(
      Layer.mergeAll(
        ActivityBestEffortJobRepositoryLive,
        ActivityStreamsRepositoryLive,
        HeartRateZoneSnapshotRepositoryLive,
        HeartRateZoneTimeJobRepositoryLive,
      ),
    ),
  );
