import { activityRouteHeatmapJobDefinition } from "../activity-job-definitions";
import { calculateActivityRouteHeatmapContributions } from "./activity-route-heatmap";
import {
  clearActivityRouteHeatmapContributions,
  getActivityRouteHeatmapCalculationInputs,
  replaceActivityRouteHeatmapContributions,
} from "./activity-route-heatmap.repository";

export const activityRouteHeatmapJobModule =
  activityRouteHeatmapJobDefinition.implement(
    async ({ activityId }, context) => {
      const inputs = await getActivityRouteHeatmapCalculationInputs({
        activityId,
        database: context.database,
      });

      if (!inputs?.qualifies) {
        await clearActivityRouteHeatmapContributions({
          activityId,
          database: context.database,
        });
        return;
      }

      const contributions = calculateActivityRouteHeatmapContributions({
        coordinates: inputs.coordinates,
      });
      context.signal.throwIfAborted();
      await replaceActivityRouteHeatmapContributions({
        activityId: inputs.activityId,
        activityStartAt: inputs.activityStartAt,
        contributions,
        database: context.database,
        userId: inputs.userId,
      });
    },
  );
