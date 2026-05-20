import { db } from "@korex/db";
import { Layer } from "effect";
import {
  deleteActivity,
  replaceActivityLaps,
  upsertActivity,
} from "../activities/artifacts/activity-import.repository";
import { enqueueActivityRouteHeatmapCalculation } from "../activities/route-heatmap/activity-route-heatmap-jobs.repository";
import { ActivityImportWriter } from "./activity-sync.dependencies";
import {
  clearExternalActivityActivityLink,
  linkExternalActivityToActivity,
  upsertExternalActivity,
} from "./repositories/external-activities.repository";

export const ActivityImportWriterLive = Layer.succeed(ActivityImportWriter, {
  storeExternalActivity: upsertExternalActivity,
  storeCoreActivity: ({ activity, activityId, externalActivityId, laps }) =>
    db.transaction(async (tx) => {
      const upsertedActivity = await upsertActivity({
        activityId,
        database: tx,
        input: activity,
      });

      await replaceActivityLaps({
        activityId: upsertedActivity.activityId,
        database: tx,
        laps,
      });

      await linkExternalActivityToActivity({
        activityId: upsertedActivity.activityId,
        database: tx,
        externalActivityId,
      });

      await enqueueActivityRouteHeatmapCalculation({
        activityId: upsertedActivity.activityId,
        database: tx,
      });

      return upsertedActivity;
    }),
  unlinkUnsupportedActivity: ({ activityId, externalActivityId }) =>
    db.transaction(async (tx) => {
      await clearExternalActivityActivityLink(externalActivityId, tx);
      await deleteActivity(activityId, tx);
    }),
});
