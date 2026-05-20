import { db } from "@korex/db";
import { Effect, Layer } from "effect";
import { enqueueActivityRouteHeatmapCalculation } from "../route-heatmap/activity-route-heatmap-jobs.repository";
import {
  type ActivityArtifactDatabase,
  ActivityArtifactRepository,
  ActivityArtifactWorkflow,
  ActivityRouteHeatmapJobRepository,
} from "./activity-artifact-workflow.dependencies";
import { replaceActivityMap } from "./activity-artifacts.repository";

export const ActivityArtifactRepositoryLive = Layer.succeed(
  ActivityArtifactRepository,
  {
    replaceActivityMap,
    transaction: (work) =>
      db.transaction((tx) => work(tx as ActivityArtifactDatabase)),
  },
);

export const ActivityRouteHeatmapJobRepositoryLive = Layer.succeed(
  ActivityRouteHeatmapJobRepository,
  {
    enqueueActivityRouteHeatmapCalculation,
  },
);

export const ActivityArtifactWorkflowLayer = Layer.effect(
  ActivityArtifactWorkflow,
  Effect.gen(function* () {
    const artifactRepository = yield* ActivityArtifactRepository;
    const routeHeatmapJobRepository = yield* ActivityRouteHeatmapJobRepository;

    return {
      replaceActivityMapAndQueueHeatmapCalculation: ({ activityId, map }) =>
        Effect.promise(() =>
          artifactRepository.transaction(async (database) => {
            await artifactRepository.replaceActivityMap({
              activityId,
              database,
              map,
            });

            await routeHeatmapJobRepository.enqueueActivityRouteHeatmapCalculation(
              {
                activityId,
                database,
              },
            );
          }),
        ),
    };
  }),
);

export const ActivityArtifactWorkflowLive = ActivityArtifactWorkflowLayer.pipe(
  Layer.provide(
    Layer.mergeAll(
      ActivityArtifactRepositoryLive,
      ActivityRouteHeatmapJobRepositoryLive,
    ),
  ),
);
