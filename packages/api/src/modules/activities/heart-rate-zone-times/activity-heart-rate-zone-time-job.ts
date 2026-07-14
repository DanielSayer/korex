import type { JobHandler } from "../../job-runtime/job-runtime";
import {
  getActivityHeartRateZoneCalculationInputs,
  replaceActivityHeartRateZoneTimes,
} from "./activity-heart-rate-zone-time.repository";
import { calculateActivityHeartRateZoneTimes } from "./activity-heart-rate-zone-times";

export const activityHeartRateZoneTimeJobName =
  "activity.heart-rate-zone-time.calculate";

type ActivityHeartRateZoneTimeJobDependencies = {
  calculate: typeof calculateActivityHeartRateZoneTimes;
  getInputs: typeof getActivityHeartRateZoneCalculationInputs;
  replaceTimes: typeof replaceActivityHeartRateZoneTimes;
};

export function createActivityHeartRateZoneTimeJobModule(
  dependencies: ActivityHeartRateZoneTimeJobDependencies,
) {
  return {
    handler: async (
      payload: Record<string, unknown>,
      context: Parameters<JobHandler>[1],
    ) => {
      context.signal.throwIfAborted();
      const activityId = requiredActivityId(payload);
      const inputs = await dependencies.getInputs({
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

      const times = dependencies.calculate(inputs);
      context.signal.throwIfAborted();
      await dependencies.replaceTimes({
        activityId,
        database: context.database,
        times,
      });
    },
    name: activityHeartRateZoneTimeJobName,
  };
}

export const activityHeartRateZoneTimeJobModule =
  createActivityHeartRateZoneTimeJobModule({
    calculate: calculateActivityHeartRateZoneTimes,
    getInputs: getActivityHeartRateZoneCalculationInputs,
    replaceTimes: replaceActivityHeartRateZoneTimes,
  });

function requiredActivityId(payload: Record<string, unknown>) {
  const activityId = payload.activityId;

  if (!Number.isInteger(activityId)) {
    throw new Error(
      "Activity Heart Rate Zone Time job requires an integer activityId",
    );
  }

  return activityId as number;
}
