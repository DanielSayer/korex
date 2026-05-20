import { Effect, Layer } from "effect";
import { ActivityArtifactWorkflowLive } from "../activities/artifacts/activity-artifact-workflow.live";
import { replaceActivityMapAndQueueHeatmapCalculation } from "../activities/artifacts/activity-artifact-workflow.service";
import { ActivityHeartRateZoneTimeWorkflowLive } from "../activities/heart-rate-zone-times/activity-heart-rate-zone-time-workflow.live";
import { replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation } from "../activities/heart-rate-zone-times/activity-heart-rate-zone-time-workflow.service";
import { markProviderConnectionSynced } from "../provider-connections/provider-connections.repository";
import { ProviderSessionLive } from "../provider-connections/provider-session.live";
import { ActivityImportWriterLive } from "./activity-import-writer.live";
import {
  ActivityArtifactStore,
  ActivitySyncRepository,
  IntervalsIcuActivitySync,
} from "./activity-sync.dependencies";
import { syncIntervalsIcuActivity } from "./providers/intervals-icu/intervals-icu-sync";
import {
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

const ActivityArtifactStoreLive = Layer.succeed(ActivityArtifactStore, {
  storeExternalMap: upsertExternalActivityMap,
  replaceCoreMap: (input) =>
    Effect.runPromise(
      replaceActivityMapAndQueueHeatmapCalculation(input).pipe(
        Effect.provide(ActivityArtifactWorkflowLive),
      ),
    ),
  storeExternalStream: upsertExternalActivityStream,
  replaceCoreStreamsAndQueueCalculation: (input) =>
    Effect.runPromise(
      replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation(input).pipe(
        Effect.provide(ActivityHeartRateZoneTimeWorkflowLive),
      ),
    ),
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
  ActivityArtifactWorkflowLive,
  ActivityHeartRateZoneTimeWorkflowLive,
  ProviderSessionLive,
  IntervalsIcuActivitySyncLive,
);
