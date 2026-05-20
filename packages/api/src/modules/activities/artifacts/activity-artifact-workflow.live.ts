import { db } from "@korex/db";
import { Effect, Layer } from "effect";
import { enqueueActivityRouteHeatmapCalculation } from "../route-heatmap/activity-route-heatmap-jobs.repository";
import { ActivityArtifactWorkflow } from "./activity-artifact-workflow.dependencies";
import { replaceActivityMap } from "./activity-artifacts.repository";

export const ActivityArtifactWorkflowLive = Layer.succeed(
  ActivityArtifactWorkflow,
  {
    replaceActivityMapAndQueueHeatmapCalculation: ({ activityId, map }) =>
      Effect.promise(() =>
        db.transaction(async (tx) => {
          await replaceActivityMap({
            activityId,
            database: tx,
            map,
          });

          await enqueueActivityRouteHeatmapCalculation({
            activityId,
            database: tx,
          });
        }),
      ),
  },
);
