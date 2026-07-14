import { activityBestEffortJobDefinition } from "../activity-job-definitions";
import {
  getActivityBestEffortCalculationInputs,
  refreshPersonalBestEfforts,
  replaceActivityBestEfforts,
} from "./activity-best-effort.repository";
import { calculateActivityBestEfforts } from "./activity-best-efforts";

export const activityBestEffortJobModule =
  activityBestEffortJobDefinition.implement(async ({ activityId }, context) => {
    const inputs = await getActivityBestEffortCalculationInputs({
      activityId,
      database: context.database,
    });

    if (!inputs.activity) {
      return;
    }

    const { activity } = inputs;
    const efforts =
      activity.sportType === "run" || activity.sportType === "treadmill"
        ? calculateActivityBestEfforts({
            distanceSamples: inputs.distanceSamples,
            elapsedTimeSamples: inputs.elapsedTimeSamples,
          })
        : [];

    context.signal.throwIfAborted();
    await context.database.transaction(async (database) => {
      const affectedDistanceCodes = await replaceActivityBestEfforts({
        activityId,
        activityStartAt: activity.activityStartAt,
        database,
        efforts,
        sportType: activity.sportType,
        userId: activity.userId,
      });

      await refreshPersonalBestEfforts({
        database,
        standardDistanceCodes: affectedDistanceCodes,
        userId: activity.userId,
      });
    });
  });
