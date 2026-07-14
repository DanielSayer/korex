import { db } from "@korex/db";
import {
  clearActivityHeartRateZoneTimes,
  replaceActivityHeartRateZoneSnapshots,
} from "./activity-heart-rate-zone-time.repository";
import { enqueueActivityHeartRateZoneTimeCalculation } from "./activity-heart-rate-zone-time-jobs.repository";

export async function replaceActivityHeartRateZoneSnapshotsAndQueueCalculation({
  activityId,
  database = db,
  snapshots,
}: {
  activityId: number;
  database?: typeof db;
  snapshots: Parameters<
    typeof replaceActivityHeartRateZoneSnapshots
  >[0]["snapshots"];
}) {
  await database.transaction(async (transaction) => {
    await replaceActivityHeartRateZoneSnapshots({
      activityId,
      database: transaction,
      snapshots,
    });
    await clearActivityHeartRateZoneTimes({
      activityId,
      database: transaction,
    });
    await enqueueActivityHeartRateZoneTimeCalculation({
      activityId,
      database: transaction,
    });
  });
}
