import type { JobHandler } from "../../job-runtime/job-runtime";
import { calculateActivityRouteHeatmapContributions } from "./activity-route-heatmap";
import {
  clearActivityRouteHeatmapContributions,
  getActivityRouteHeatmapCalculationInputs,
  replaceActivityRouteHeatmapContributions,
} from "./activity-route-heatmap.repository";

export const activityRouteHeatmapJobName = "activity.route-heatmap.calculate";

type ActivityRouteHeatmapJobDependencies = {
  calculate: typeof calculateActivityRouteHeatmapContributions;
  clearContributions: typeof clearActivityRouteHeatmapContributions;
  getInputs: typeof getActivityRouteHeatmapCalculationInputs;
  replaceContributions: typeof replaceActivityRouteHeatmapContributions;
};

export function createActivityRouteHeatmapJobModule(
  dependencies: ActivityRouteHeatmapJobDependencies,
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

      if (!inputs?.qualifies) {
        await dependencies.clearContributions({
          activityId,
          database: context.database,
        });
        return;
      }

      const contributions = dependencies.calculate({
        coordinates: inputs.coordinates,
      });
      context.signal.throwIfAborted();
      await dependencies.replaceContributions({
        activityId: inputs.activityId,
        activityStartAt: inputs.activityStartAt,
        contributions,
        database: context.database,
        userId: inputs.userId,
      });
    },
    name: activityRouteHeatmapJobName,
  };
}

export const activityRouteHeatmapJobModule =
  createActivityRouteHeatmapJobModule({
    calculate: calculateActivityRouteHeatmapContributions,
    clearContributions: clearActivityRouteHeatmapContributions,
    getInputs: getActivityRouteHeatmapCalculationInputs,
    replaceContributions: replaceActivityRouteHeatmapContributions,
  });

function requiredActivityId(payload: Record<string, unknown>) {
  const activityId = payload.activityId;

  if (!Number.isInteger(activityId)) {
    throw new Error(
      "Activity Route Heatmap job requires an integer activityId",
    );
  }

  return activityId as number;
}
