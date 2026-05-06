import { db } from "@korex/db";
import { Effect, Layer } from "effect";
import {
  deleteActivity,
  replaceActivityLaps,
  upsertActivity,
} from "../activities/activities.repository";
import { ProviderSessionLive } from "../provider-connections/provider-session.live";
import {
  ActivityImportWriter,
  ActivitySyncRepository,
  IntervalsIcuActivitySync,
} from "./activity-sync.dependencies";
import { syncIntervalsIcuActivity } from "./providers/intervals-icu/intervals-icu-sync";
import {
  clearExternalActivityActivityLink,
  linkExternalActivityToActivity,
  upsertExternalActivity,
} from "./repositories/external-activities.repository";
import {
  createActivitySyncRun,
  finishActivitySyncRun,
  hasSuccessfulActivitySyncRunForUser,
} from "./repositories/sync-runs.repository";

export const ActivitySyncRepositoryLive = Layer.succeed(
  ActivitySyncRepository,
  {
    createActivitySyncRun,
    finishActivitySyncRun,
    hasSuccessfulActivitySyncRunForUser,
  },
);

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

      return upsertedActivity;
    }),
  unlinkUnsupportedActivity: ({ activityId, externalActivityId }) =>
    db.transaction(async (tx) => {
      await clearExternalActivityActivityLink(externalActivityId, tx);
      await deleteActivity(activityId, tx);
    }),
});

export const IntervalsIcuActivitySyncLive = Layer.succeed(
  IntervalsIcuActivitySync,
  {
    syncActivity: (input) =>
      syncIntervalsIcuActivity(input).pipe(
        Effect.provide(ActivityImportWriterLive),
      ),
  },
);

export const ActivitySyncLive = Layer.mergeAll(
  ActivityImportWriterLive,
  ActivitySyncRepositoryLive,
  ProviderSessionLive,
  IntervalsIcuActivitySyncLive,
);
