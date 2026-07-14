import type { JobHandler } from "../../job-runtime/job-runtime";
import {
  getActivityBestEffortCalculationInputs,
  refreshPersonalBestEfforts,
  replaceActivityBestEfforts,
} from "./activity-best-effort.repository";
import { calculateActivityBestEfforts } from "./activity-best-efforts";

export const activityBestEffortJobName = "activity.best-effort.calculate";

type ActivityBestEffortJobDependencies = {
  calculate: typeof calculateActivityBestEfforts;
  getInputs: typeof getActivityBestEffortCalculationInputs;
  refreshPersonalBests: typeof refreshPersonalBestEfforts;
  replaceBestEfforts: typeof replaceActivityBestEfforts;
};

export function createActivityBestEffortJobModule(
  dependencies: ActivityBestEffortJobDependencies,
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

      if (!inputs.activity) {
        return;
      }

      const { activity } = inputs;
      const efforts =
        activity.sportType === "run" || activity.sportType === "treadmill"
          ? dependencies.calculate({
              distanceSamples: inputs.distanceSamples,
              elapsedTimeSamples: inputs.elapsedTimeSamples,
            })
          : [];

      context.signal.throwIfAborted();
      await context.database.transaction(async (database) => {
        const affectedDistanceCodes = await dependencies.replaceBestEfforts({
          activityId,
          activityStartAt: activity.activityStartAt,
          database,
          efforts,
          sportType: activity.sportType,
          userId: activity.userId,
        });

        await dependencies.refreshPersonalBests({
          database,
          standardDistanceCodes: affectedDistanceCodes,
          userId: activity.userId,
        });
      });
    },
    name: activityBestEffortJobName,
  };
}

export const activityBestEffortJobModule = createActivityBestEffortJobModule({
  calculate: calculateActivityBestEfforts,
  getInputs: getActivityBestEffortCalculationInputs,
  refreshPersonalBests: refreshPersonalBestEfforts,
  replaceBestEfforts: replaceActivityBestEfforts,
});

function requiredActivityId(payload: Record<string, unknown>) {
  const activityId = payload.activityId;

  if (!Number.isInteger(activityId)) {
    throw new Error("Activity best effort job requires an integer activityId");
  }

  return activityId as number;
}
