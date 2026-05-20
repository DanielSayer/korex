import { Context, type Effect } from "effect";
import type { ActivityMapInput } from "../activities.types";
import type { enqueueActivityRouteHeatmapCalculation } from "../route-heatmap/activity-route-heatmap-jobs.repository";
import type { replaceActivityMap } from "./activity-artifacts.repository";

export type ActivityArtifactDatabase = NonNullable<
  Parameters<typeof replaceActivityMap>[0]["database"]
>;

export type ActivityArtifactRepositoryService = {
  replaceActivityMap: (
    input: Omit<Parameters<typeof replaceActivityMap>[0], "database"> & {
      database?: ActivityArtifactDatabase;
    },
  ) => Promise<void>;
  transaction: <T>(
    work: (database: ActivityArtifactDatabase) => Promise<T>,
  ) => Promise<T>;
};

export class ActivityArtifactRepository extends Context.Tag(
  "ActivityArtifactRepository",
)<ActivityArtifactRepository, ActivityArtifactRepositoryService>() {}

export type ActivityRouteHeatmapJobRepositoryService = {
  enqueueActivityRouteHeatmapCalculation: (
    input: Omit<
      Parameters<typeof enqueueActivityRouteHeatmapCalculation>[0],
      "database"
    > & { database?: ActivityArtifactDatabase },
  ) => Promise<void>;
};

export class ActivityRouteHeatmapJobRepository extends Context.Tag(
  "ActivityArtifactRouteHeatmapJobRepository",
)<
  ActivityRouteHeatmapJobRepository,
  ActivityRouteHeatmapJobRepositoryService
>() {}

export type ActivityArtifactWorkflowService = {
  replaceActivityMapAndQueueHeatmapCalculation: (input: {
    activityId: number;
    map: ActivityMapInput;
  }) => Effect.Effect<void>;
};

export class ActivityArtifactWorkflow extends Context.Tag(
  "ActivityArtifactWorkflow",
)<ActivityArtifactWorkflow, ActivityArtifactWorkflowService>() {}
