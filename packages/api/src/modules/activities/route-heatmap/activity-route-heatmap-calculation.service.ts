import { Effect } from "effect";
import type { ActivityRouteHeatmapCalculationJob } from "./activity-route-heatmap-jobs.repository";
import { ActivityRouteHeatmapWorkflowLive } from "./activity-route-heatmap-workflow.live";
import { processActivityRouteHeatmapCalculationJob as processActivityRouteHeatmapCalculationJobWorkflow } from "./activity-route-heatmap-workflow.service";

export async function processActivityRouteHeatmapCalculationJob(
  job: ActivityRouteHeatmapCalculationJob,
) {
  await Effect.runPromise(
    processActivityRouteHeatmapCalculationJobWorkflow(job).pipe(
      Effect.provide(ActivityRouteHeatmapWorkflowLive),
    ),
  );
}
