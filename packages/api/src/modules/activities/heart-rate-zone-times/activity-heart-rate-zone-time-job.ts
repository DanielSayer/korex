import { activityHeartRateZoneTimeJobDefinition } from "../activity-job-definitions";
import {
  getActivityHeartRateZoneCalculationInputs,
  replaceActivityHeartRateZoneTimes,
} from "./activity-heart-rate-zone-time.repository";
import { calculateActivityHeartRateZoneTimes } from "./activity-heart-rate-zone-times";

export const activityHeartRateZoneTimeJobModule =
  activityHeartRateZoneTimeJobDefinition.implement(
    async ({ activityId }, context) => {
      const inputs = await getActivityHeartRateZoneCalculationInputs({
        activityId,
        database: context.database,
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
      context.signal.throwIfAborted();
      await replaceActivityHeartRateZoneTimes({
        activityId,
        database: context.database,
        times,
      });
    },
  );
