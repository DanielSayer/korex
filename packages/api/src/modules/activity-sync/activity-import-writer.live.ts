import { db } from "@korex/db";
import { Effect, Layer } from "effect";
import {
  deleteActivity,
  replaceActivityLaps,
  upsertActivity,
} from "../activities/artifacts/activity-import.repository";
import { enqueueActivityRouteHeatmapCalculation } from "../activities/route-heatmap/activity-route-heatmap-jobs.repository";
import {
  type ActivityImportDatabase,
  ActivityImportRepository,
  ActivityImportWriter,
  ActivityRouteHeatmapJobRepository,
  ExternalActivityRepository,
} from "./activity-sync.dependencies";
import {
  clearExternalActivityActivityLink,
  linkExternalActivityToActivity,
  upsertExternalActivity,
} from "./repositories/external-activities.repository";

export const ActivityImportRepositoryLive = Layer.succeed(
  ActivityImportRepository,
  {
    deleteActivity,
    replaceActivityLaps,
    transaction: (work) =>
      db.transaction((tx) => work(tx as ActivityImportDatabase)),
    upsertActivity,
  },
);

export const ExternalActivityRepositoryLive = Layer.succeed(
  ExternalActivityRepository,
  {
    clearExternalActivityActivityLink,
    linkExternalActivityToActivity,
    upsertExternalActivity,
  },
);

export const ActivityRouteHeatmapJobRepositoryLive = Layer.succeed(
  ActivityRouteHeatmapJobRepository,
  {
    enqueueActivityRouteHeatmapCalculation,
  },
);

export const ActivityImportWriterLayer = Layer.effect(
  ActivityImportWriter,
  Effect.gen(function* () {
    const activityImportRepository = yield* ActivityImportRepository;
    const externalActivityRepository = yield* ExternalActivityRepository;
    const routeHeatmapJobRepository = yield* ActivityRouteHeatmapJobRepository;

    return {
      storeExternalActivity: externalActivityRepository.upsertExternalActivity,
      storeCoreActivity: ({ activity, activityId, externalActivityId, laps }) =>
        activityImportRepository.transaction(async (database) => {
          const upsertedActivity =
            await activityImportRepository.upsertActivity({
              activityId,
              database,
              input: activity,
            });

          await activityImportRepository.replaceActivityLaps({
            activityId: upsertedActivity.activityId,
            database,
            laps,
          });

          await externalActivityRepository.linkExternalActivityToActivity({
            activityId: upsertedActivity.activityId,
            database,
            externalActivityId,
          });

          await routeHeatmapJobRepository.enqueueActivityRouteHeatmapCalculation(
            {
              activityId: upsertedActivity.activityId,
              database,
            },
          );

          return upsertedActivity;
        }),
      unlinkUnsupportedActivity: ({ activityId, externalActivityId }) =>
        activityImportRepository.transaction(async (database) => {
          await externalActivityRepository.clearExternalActivityActivityLink(
            externalActivityId,
            database,
          );
          await activityImportRepository.deleteActivity(activityId, database);
        }),
    };
  }),
);

export const ActivityImportWriterLive = ActivityImportWriterLayer.pipe(
  Layer.provide(
    Layer.mergeAll(
      ActivityImportRepositoryLive,
      ActivityRouteHeatmapJobRepositoryLive,
      ExternalActivityRepositoryLive,
    ),
  ),
);
