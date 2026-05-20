import { Context, type Effect } from "effect";
import type {
  clearActivityRouteHeatmapContributions,
  getActivityRouteHeatmapCalculationInputs,
  replaceActivityRouteHeatmapContributions,
} from "./activity-route-heatmap.repository";
import type { ActivityRouteHeatmapCalculationJob } from "./activity-route-heatmap-jobs.repository";

export type ActivityRouteHeatmapProjectionRepositoryService = {
  clearActivityRouteHeatmapContributions: (
    input: Parameters<typeof clearActivityRouteHeatmapContributions>[0],
  ) => Promise<void>;
  getActivityRouteHeatmapCalculationInputs: (
    input: Parameters<typeof getActivityRouteHeatmapCalculationInputs>[0],
  ) => ReturnType<typeof getActivityRouteHeatmapCalculationInputs>;
  replaceActivityRouteHeatmapContributions: (
    input: Parameters<typeof replaceActivityRouteHeatmapContributions>[0],
  ) => Promise<void>;
};

export class ActivityRouteHeatmapProjectionRepository extends Context.Tag(
  "ActivityRouteHeatmapProjectionRepository",
)<
  ActivityRouteHeatmapProjectionRepository,
  ActivityRouteHeatmapProjectionRepositoryService
>() {}

export type ActivityRouteHeatmapJobRepositoryService = {
  claimActivityRouteHeatmapCalculationJobs: (input: {
    batchSize: number;
    now: Date;
    staleLockedBefore: Date;
    workerId: string;
  }) => Promise<ActivityRouteHeatmapCalculationJob[]>;
  markActivityRouteHeatmapCalculationFailed: (input: {
    error: string;
    jobId: number;
    now?: Date;
  }) => Promise<void>;
  markActivityRouteHeatmapCalculationSucceeded: (input: {
    jobId: number;
    now?: Date;
  }) => Promise<void>;
};

export class ActivityRouteHeatmapJobRepository extends Context.Tag(
  "ActivityRouteHeatmapJobRepository",
)<
  ActivityRouteHeatmapJobRepository,
  ActivityRouteHeatmapJobRepositoryService
>() {}

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
