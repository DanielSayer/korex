import { db } from "@korex/db";
import { Effect, Layer } from "effect";
import { replaceActivityMap } from "../activities/activity-artifacts.repository";
import { replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation } from "../activities/activity-heart-rate-zone-time.repository";
import {
  deleteActivity,
  replaceActivityLaps,
  upsertActivity,
} from "../activities/activity-import.repository";
import { markProviderConnectionSynced } from "../provider-connections/provider-connections.repository";
import { ProviderSessionLive } from "../provider-connections/provider-session.live";
import {
  ActivityArtifactStore,
  ActivityImportWriter,
  ActivitySyncRepository,
  IntervalsIcuActivitySync,
} from "./activity-sync.dependencies";
import { syncIntervalsIcuActivity } from "./providers/intervals-icu/intervals-icu-sync";
import {
  clearExternalActivityActivityLink,
  linkExternalActivityToActivity,
  upsertExternalActivity,
  upsertExternalActivityMap,
  upsertExternalActivityStream,
} from "./repositories/external-activities.repository";
import {
  createActivitySyncRun,
  finishActivitySyncRun,
  getLatestIncrementalActivitySyncRunForUser,
  getLatestSuccessfulActivitySyncRunForUser,
  hasSuccessfulActivitySyncRunForUser,
} from "./repositories/sync-runs.repository";

const ActivitySyncRepositoryLive = Layer.succeed(ActivitySyncRepository, {
  createActivitySyncRun,
  finishActivitySyncRun,
  getLatestIncrementalActivitySyncRunForUser,
  getLatestSuccessfulActivitySyncRunForUser,
  hasSuccessfulActivitySyncRunForUser,
  markProviderConnectionSynced,
});

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

const ActivityArtifactStoreLive = Layer.succeed(ActivityArtifactStore, {
  storeExternalMap: upsertExternalActivityMap,
  replaceCoreMap: replaceActivityMap,
  storeExternalStream: upsertExternalActivityStream,
  replaceCoreStreamsAndQueueCalculation:
    replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation,
});

const IntervalsIcuActivitySyncLive = Layer.succeed(IntervalsIcuActivitySync, {
  syncActivity: (input) =>
    syncIntervalsIcuActivity(input).pipe(
      Effect.provide(
        Layer.mergeAll(ActivityArtifactStoreLive, ActivityImportWriterLive),
      ),
    ),
});

export const ActivitySyncLive = Layer.mergeAll(
  ActivityArtifactStoreLive,
  ActivityImportWriterLive,
  ActivitySyncRepositoryLive,
  ProviderSessionLive,
  IntervalsIcuActivitySyncLive,
);
