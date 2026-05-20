import { Effect } from "effect";
import type { RunActivityRouteHeatmapWorkerOnceInput } from "./activity-route-heatmap-workflow.dependencies";
import { ActivityRouteHeatmapWorkflowLive } from "./activity-route-heatmap-workflow.live";
import { runActivityRouteHeatmapWorkerOnce as runActivityRouteHeatmapWorkerOnceWorkflow } from "./activity-route-heatmap-workflow.service";

export function runActivityRouteHeatmapWorkerOnce(
  input: RunActivityRouteHeatmapWorkerOnceInput,
) {
  return Effect.runPromise(
    runActivityRouteHeatmapWorkerOnceWorkflow(input).pipe(
      Effect.provide(ActivityRouteHeatmapWorkflowLive),
    ),
  );
}
