import { calculateActivityRouteHeatmapContributions } from "./activity-route-heatmap";
import {
  clearActivityRouteHeatmapContributions,
  getActivityRouteHeatmapCalculationInputs,
  replaceActivityRouteHeatmapContributions,
} from "./activity-route-heatmap.repository";
import {
  type ActivityRouteHeatmapCalculationJob,
  markActivityRouteHeatmapCalculationFailed,
  markActivityRouteHeatmapCalculationSucceeded,
} from "./activity-route-heatmap-jobs.repository";

export async function processActivityRouteHeatmapCalculationJob(
  job: ActivityRouteHeatmapCalculationJob,
) {
  try {
    const inputs = await getActivityRouteHeatmapCalculationInputs({
      activityId: job.activityId,
    });

    if (!inputs?.qualifies) {
      await clearActivityRouteHeatmapContributions({
        activityId: job.activityId,
      });
      await markActivityRouteHeatmapCalculationSucceeded({
        jobId: job.id,
      });
      return;
    }

    const contributions = calculateActivityRouteHeatmapContributions({
      coordinates: inputs.coordinates,
    });

    await replaceActivityRouteHeatmapContributions({
      activityId: inputs.activityId,
      activityStartAt: inputs.activityStartAt,
      contributions,
      userId: inputs.userId,
    });
    await markActivityRouteHeatmapCalculationSucceeded({
      jobId: job.id,
    });
  } catch (error) {
    await markActivityRouteHeatmapCalculationFailed({
      error: error instanceof Error ? error.message : "Unknown error",
      jobId: job.id,
    });
  }
}
