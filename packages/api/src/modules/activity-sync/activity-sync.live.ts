import { db } from "@korex/db";
import { intervalsIcuClient } from "@korex/integrations/intervals-icu/live";
import { activityStreamReplacementModule } from "../activities/activity-stream-replacement/activity-stream-replacement.module";
import { activityArtifactModule } from "../activities/artifacts/activity-artifact.module";
import { enqueueJob } from "../job-runtime/job-runtime";
import { markProviderConnectionSynced } from "../provider-connections/provider-connections.repository";
import { providerSessionModule } from "../provider-connections/provider-session.live";
import { activityImportWriter } from "./activity-import-writer.live";
import type {
  ActivitySyncRepositoryService,
  IntervalsIcuActivitySyncService,
} from "./activity-sync.dependencies";
import { createActivitySyncModule } from "./activity-sync.service";
import {
  activitySyncJobName,
  createActivitySyncCommandModule,
  createActivitySyncJobModule,
  createActivitySyncTaskModule,
} from "./activity-sync-durable";
import { syncIntervalsIcuActivity } from "./providers/intervals-icu/intervals-icu-sync";
import {
  upsertExternalActivityMap,
  upsertExternalActivityStream,
} from "./repositories/external-activities.repository";
import {
  claimActivitySyncRun,
  createActivitySyncRun,
  createQueuedActivitySyncRun,
  finishActivitySyncRun,
  getActivitySyncRunForTask,
  getLatestIncrementalActivitySyncRunForUser,
  getLatestSuccessfulActivitySyncRunForUser,
  hasSuccessfulActivitySyncRunForUser,
  markActivitySyncRunExecutionFailed,
  resetActivitySyncRunForRetry,
} from "./repositories/sync-runs.repository";

export const activitySyncRepository: ActivitySyncRepositoryService = {
  createActivitySyncRun,
  finishActivitySyncRun,
  getLatestIncrementalActivitySyncRunForUser,
  getLatestSuccessfulActivitySyncRunForUser,
  hasSuccessfulActivitySyncRunForUser,
  markProviderConnectionSynced,
};

export const intervalsIcuActivitySync: IntervalsIcuActivitySyncService = {
  syncActivity: (input) =>
    syncIntervalsIcuActivity({
      ...input,
      artifactStore: {
        replaceCoreMap:
          activityArtifactModule.replaceActivityMapAndQueueHeatmapCalculation,
        replaceCoreStreamsAndQueueCalculation:
          activityStreamReplacementModule.replaceActivityStreamsAndInvalidateDerivedData,
        storeExternalMap: upsertExternalActivityMap,
        storeExternalStream: upsertExternalActivityStream,
      },
      writer: activityImportWriter,
    }),
};

export const activitySyncModule = createActivitySyncModule({
  activitySyncRepository,
  intervalsIcuActivitySync,
  intervalsIcuClient,
  providerSession: providerSessionModule,
});

const activitySyncDurableRepository = {
  claimActivitySyncRun,
  enqueueActivitySyncRun,
  getActivitySyncRunForTask,
  getLatestIncrementalActivitySyncRunForUser,
  getLatestSuccessfulActivitySyncRunForUser,
  hasSuccessfulActivitySyncRunForUser,
  markActivitySyncRunExecutionFailed,
  resetActivitySyncRunForRetry,
};

export async function enqueueActivitySyncRun({
  provider,
  syncType,
  userId,
}: {
  provider: "intervals_icu";
  syncType: "initial" | "incremental";
  userId: string;
}) {
  return db.transaction(async (database) => {
    const syncRun = await createQueuedActivitySyncRun({
      database,
      provider,
      syncType,
      userId,
    });
    await enqueueJob({
      database,
      key: String(syncRun.id),
      name: activitySyncJobName,
      payload: { syncRunId: syncRun.id, userId },
    });
    return syncRun;
  });
}

export const activitySyncCommandModule = createActivitySyncCommandModule({
  now: () => new Date(),
  repository: activitySyncDurableRepository,
});

export const activitySyncTaskModule = createActivitySyncTaskModule({
  activitySync: activitySyncModule,
  repository: activitySyncDurableRepository,
});

export const activitySyncJobModule = createActivitySyncJobModule(
  activitySyncTaskModule,
);
