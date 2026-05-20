import { Effect, Layer } from "effect";
import { ActivityArtifactWorkflow } from "../activities/artifacts/activity-artifact-workflow.dependencies";
import { ActivityArtifactWorkflowLive } from "../activities/artifacts/activity-artifact-workflow.live";
import { ActivityHeartRateZoneTimeWorkflow } from "../activities/heart-rate-zone-times/activity-heart-rate-zone-time-workflow.dependencies";
import { ActivityHeartRateZoneTimeWorkflowLive } from "../activities/heart-rate-zone-times/activity-heart-rate-zone-time-workflow.live";
import { markProviderConnectionSynced } from "../provider-connections/provider-connections.repository";
import { ProviderSessionLive } from "../provider-connections/provider-session.live";
import { ActivityImportWriterLive } from "./activity-import-writer.live";
import {
  ActivityArtifactStore,
  ActivityImportWriter,
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

const ActivityArtifactStoreLive = Layer.effect(
  ActivityArtifactStore,
  Effect.gen(function* () {
    const activityArtifactWorkflow = yield* ActivityArtifactWorkflow;
    const heartRateZoneTimeWorkflow = yield* ActivityHeartRateZoneTimeWorkflow;

    return {
      storeExternalMap: upsertExternalActivityMap,
      replaceCoreMap: (input) =>
        Effect.runPromise(
          activityArtifactWorkflow.replaceActivityMapAndQueueHeatmapCalculation(
            input,
          ),
        ),
      storeExternalStream: upsertExternalActivityStream,
      replaceCoreStreamsAndQueueCalculation: (input) =>
        Effect.runPromise(
          heartRateZoneTimeWorkflow.replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation(
            input,
          ),
        ),
    };
  }),
);

const IntervalsIcuActivitySyncLive = Layer.effect(
  IntervalsIcuActivitySync,
  Effect.gen(function* () {
    const activityArtifactStore = yield* ActivityArtifactStore;
    const activityImportWriter = yield* ActivityImportWriter;

    return {
      syncActivity: (input) =>
        syncIntervalsIcuActivity(input).pipe(
          Effect.provideService(ActivityArtifactStore, activityArtifactStore),
          Effect.provideService(ActivityImportWriter, activityImportWriter),
        ),
    };
  }),
);

const IntervalsIcuActivitySyncWithDependenciesLive =
  IntervalsIcuActivitySyncLive.pipe(
    Layer.provide(
      Layer.mergeAll(ActivityArtifactStoreLive, ActivityImportWriterLive),
    ),
  );

export const ActivitySyncLayer = Layer.mergeAll(
  ActivityArtifactStoreLive,
  ActivityImportWriterLive,
  ActivitySyncRepositoryLive,
  ProviderSessionLive,
  IntervalsIcuActivitySyncWithDependenciesLive,
);

export const ActivitySyncLive = ActivitySyncLayer.pipe(
  Layer.provide(
    Layer.mergeAll(
      ActivityArtifactWorkflowLive,
      ActivityHeartRateZoneTimeWorkflowLive,
    ),
  ),
);
