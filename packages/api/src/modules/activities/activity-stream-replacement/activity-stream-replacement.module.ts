import { db } from "@korex/db";
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

type ActivityStreamReplacementDatabase = NonNullable<
  Parameters<typeof replaceActivityStreams>[0]["database"]
>;

type HeartRateZoneInvalidationDecision =
  | { type: "clearCalculation" }
  | {
      snapshots: Parameters<
        typeof replaceActivityHeartRateZoneSnapshots
      >[0]["snapshots"];
      type: "queueCalculation";
    };

export type ActivityStreamReplacementModule = {
  replaceActivityStreamsAndInvalidateDerivedData: (input: {
    activityId: number;
    streams: ActivityStreamInput[];
    userId: string;
  }) => Promise<void>;
};

export type ActivityStreamReplacementModuleDependencies = {
  database: Pick<typeof db, "transaction">;
  deleteActivityHeartRateZoneTimeCalculationJob: typeof deleteActivityHeartRateZoneTimeCalculationJob;
  enqueueActivityBestEffortCalculation: typeof enqueueActivityBestEffortCalculation;
  enqueueActivityHeartRateZoneTimeCalculation: typeof enqueueActivityHeartRateZoneTimeCalculation;
  heartRateZones: {
    clearCalculation: typeof clearActivityHeartRateZoneCalculation;
    clearTimes: typeof clearActivityHeartRateZoneTimes;
    listUserSnapshots: typeof listUserHeartRateZoneSnapshots;
    replaceSnapshots: typeof replaceActivityHeartRateZoneSnapshots;
  };
  replaceActivityStreams: typeof replaceActivityStreams;
};

export function createActivityStreamReplacementModule({
  database,
  deleteActivityHeartRateZoneTimeCalculationJob,
  enqueueActivityBestEffortCalculation,
  enqueueActivityHeartRateZoneTimeCalculation,
  heartRateZones,
  replaceActivityStreams,
}: ActivityStreamReplacementModuleDependencies): ActivityStreamReplacementModule {
  async function planHeartRateZoneInvalidation({
    database,
    streams,
    userId,
  }: {
    database: ActivityStreamReplacementDatabase;
    streams: ActivityStreamInput[];
    userId: string;
  }): Promise<HeartRateZoneInvalidationDecision> {
    const hasHeartRateStream = streams.some(
      (stream) => stream.streamType === "heartRate",
    );

    if (!hasHeartRateStream) {
      return { type: "clearCalculation" };
    }

    const snapshots = await heartRateZones.listUserSnapshots({
      database,
      userId,
    });

    if (snapshots.length === 0) {
      return { type: "clearCalculation" };
    }

    return { snapshots, type: "queueCalculation" };
  }

  return {
    async replaceActivityStreamsAndInvalidateDerivedData({
      activityId,
      streams,
      userId,
    }) {
      await database.transaction(async (transaction) => {
        const activityDatabase =
          transaction as ActivityStreamReplacementDatabase;

        await replaceActivityStreams({
          activityId,
          database: activityDatabase,
          streams,
        });
        await enqueueActivityBestEffortCalculation({
          activityId,
          database: activityDatabase,
        });

        const decision = await planHeartRateZoneInvalidation({
          database: activityDatabase,
          streams,
          userId,
        });

        if (decision.type === "clearCalculation") {
          await heartRateZones.clearCalculation({
            activityId,
            database: activityDatabase,
          });
          await deleteActivityHeartRateZoneTimeCalculationJob({
            activityId,
            database: activityDatabase,
          });
          return;
        }

        await heartRateZones.replaceSnapshots({
          activityId,
          database: activityDatabase,
          snapshots: decision.snapshots,
        });
        await heartRateZones.clearTimes({
          activityId,
          database: activityDatabase,
        });
        await enqueueActivityHeartRateZoneTimeCalculation({
          activityId,
          database: activityDatabase,
        });
      });
    },
  };
}

export const activityStreamReplacementModule =
  createActivityStreamReplacementModule({
    database: db,
    deleteActivityHeartRateZoneTimeCalculationJob,
    enqueueActivityBestEffortCalculation,
    enqueueActivityHeartRateZoneTimeCalculation,
    heartRateZones: {
      clearCalculation: clearActivityHeartRateZoneCalculation,
      clearTimes: clearActivityHeartRateZoneTimes,
      listUserSnapshots: listUserHeartRateZoneSnapshots,
      replaceSnapshots: replaceActivityHeartRateZoneSnapshots,
    },
    replaceActivityStreams,
  });
