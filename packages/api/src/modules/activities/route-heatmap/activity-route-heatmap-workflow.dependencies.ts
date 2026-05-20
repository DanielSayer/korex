import { Context, type Effect } from "effect";
import type { ActivityRouteHeatmapCalculationJob } from "./activity-route-heatmap-jobs.repository";

export type RunActivityRouteHeatmapWorkerOnceInput = {
  batchSize: number;
  now?: Date;
  staleLockMs: number;
  workerId: string;
};

export type ActivityRouteHeatmapWorkflowService = {
  processActivityRouteHeatmapCalculationJob: (
    job: ActivityRouteHeatmapCalculationJob,
  ) => Effect.Effect<void>;
  runActivityRouteHeatmapWorkerOnce: (
    input: RunActivityRouteHeatmapWorkerOnceInput,
  ) => Effect.Effect<{ processed: number }>;
};

export class ActivityRouteHeatmapWorkflow extends Context.Tag(
  "ActivityRouteHeatmapWorkflow",
)<ActivityRouteHeatmapWorkflow, ActivityRouteHeatmapWorkflowService>() {}
