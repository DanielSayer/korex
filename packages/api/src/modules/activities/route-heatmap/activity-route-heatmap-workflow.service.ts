import { Effect } from "effect";
import type { ActivityRouteHeatmapCalculationJob } from "./activity-route-heatmap-jobs.repository";
import {
  ActivityRouteHeatmapWorkflow,
  type RunActivityRouteHeatmapWorkerOnceInput,
} from "./activity-route-heatmap-workflow.dependencies";

export function processActivityRouteHeatmapCalculationJob(
  job: ActivityRouteHeatmapCalculationJob,
) {
  return Effect.gen(function* () {
    const workflow = yield* ActivityRouteHeatmapWorkflow;

    return yield* workflow.processActivityRouteHeatmapCalculationJob(job);
  });
}

export function runActivityRouteHeatmapWorkerOnce(
  input: RunActivityRouteHeatmapWorkerOnceInput,
) {
  return Effect.gen(function* () {
    const workflow = yield* ActivityRouteHeatmapWorkflow;

    return yield* workflow.runActivityRouteHeatmapWorkerOnce(input);
  });
}
