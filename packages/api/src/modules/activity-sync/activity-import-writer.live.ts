import { db } from "@korex/db";
import {
  deleteActivity,
  replaceActivityLaps,
  upsertActivity,
} from "../activities/artifacts/activity-import.repository";
import { enqueueActivityRouteHeatmapCalculation } from "../activities/route-heatmap/activity-route-heatmap-jobs.repository";
import { enqueueCurrentTrainingStreakUpdateForActivity } from "../activities/training-streaks/training-streak.repository";
import { isTrainingStreakQualifyingSportType } from "../activities/training-streaks/training-streaks";
import { assignDefaultEquipmentForActivity } from "../equipment/equipment.repository";
import type {
  ActivityImportDatabase,
  ActivityImportRepositoryService,
  ActivityImportWriterService,
  ActivityRouteHeatmapJobRepositoryService,
  ExternalActivityRepositoryService,
} from "./activity-sync.dependencies";
import {
  clearExternalActivityActivityLink,
  linkExternalActivityToActivity,
  upsertExternalActivity,
} from "./repositories/external-activities.repository";

const activityImportRepository: ActivityImportRepositoryService = {
  deleteActivity,
  replaceActivityLaps,
  transaction: (work) =>
    db.transaction((tx) => work(tx as ActivityImportDatabase)),
  upsertActivity,
};

const externalActivityRepository: ExternalActivityRepositoryService = {
  clearExternalActivityActivityLink,
  linkExternalActivityToActivity,
  upsertExternalActivity,
};

const activityRouteHeatmapJobRepository: ActivityRouteHeatmapJobRepositoryService =
  {
    enqueueActivityRouteHeatmapCalculation: async (input) => {
      await enqueueActivityRouteHeatmapCalculation(input);
    },
  };

export function createActivityImportWriter({
  activityImportRepository,
  externalActivityRepository,
  routeHeatmapJobRepository,
}: {
  activityImportRepository: ActivityImportRepositoryService;
  externalActivityRepository: ExternalActivityRepositoryService;
  routeHeatmapJobRepository: ActivityRouteHeatmapJobRepositoryService;
}): ActivityImportWriterService {
  return {
    storeExternalActivity: externalActivityRepository.upsertExternalActivity,
    storeCoreActivity: ({ activity, activityId, externalActivityId, laps }) =>
      activityImportRepository.transaction(async (database) => {
        const upsertedActivity = await activityImportRepository.upsertActivity({
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

        await assignDefaultEquipmentForActivity({
          activityId: upsertedActivity.activityId,
          database,
          sportType: activity.sportType,
          userId: activity.userId,
        });

        await routeHeatmapJobRepository.enqueueActivityRouteHeatmapCalculation({
          activityId: upsertedActivity.activityId,
          database,
        });

        if (isTrainingStreakQualifyingSportType(activity.sportType)) {
          await enqueueCurrentTrainingStreakUpdateForActivity({
            activityStartAt: activity.startAt,
            database,
            userId: activity.userId,
          });
        }

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
}

export const activityImportWriter = createActivityImportWriter({
  activityImportRepository,
  externalActivityRepository,
  routeHeatmapJobRepository: activityRouteHeatmapJobRepository,
});
