import type { IntervalsIcuClientService } from "@korex/integrations/intervals-icu/client";
import type {
  ActivityArtifactStoreService,
  ActivityImportWriterService,
} from "../../activity-sync.dependencies";
import type {
  ActivitySyncCounters,
  ActivitySyncFailure,
} from "../../activity-sync.types";
import { storeIntervalsIcuActivityImport } from "./intervals-icu-activity-import";
import { syncIntervalsIcuActivityMap } from "./intervals-icu-activity-map-sync";
import { syncIntervalsIcuActivityStreams } from "./intervals-icu-activity-streams-sync";

export async function syncIntervalsIcuActivity({
  activityId,
  artifactStore,
  apiKey,
  athleteId,
  client,
  counters,
  errors,
  signal,
  syncRunId,
  userId,
  writer,
}: {
  activityId: string;
  artifactStore: ActivityArtifactStoreService;
  apiKey: string;
  athleteId: string;
  client: IntervalsIcuClientService;
  counters: ActivitySyncCounters;
  errors: ActivitySyncFailure[];
  signal?: AbortSignal;
  syncRunId: number;
  userId: string;
  writer: ActivityImportWriterService;
}) {
  let detailResult: Awaited<
    ReturnType<IntervalsIcuClientService["getActivityDetail"]>
  >;
  try {
    detailResult = await client.getActivityDetail({
      activityId,
      apiKey,
      signal,
    });
  } catch (cause) {
    signal?.throwIfAborted();
    errors.push({
      activityId,
      details: readField(cause, "details"),
      message:
        cause instanceof Error
          ? cause.message
          : "Failed to fetch activity detail",
      requestUrl: readStringField(cause, "requestUrl"),
      stage: "detail",
    });
    return;
  }

  const storedActivity = await storeIntervalsIcuActivityImport({
    detail: detailResult,
    errors,
    lastSyncRunId: syncRunId,
    providerAthleteId: athleteId,
    userId,
    writer,
  });

  counters.activitiesStored += 1;

  if (storedActivity.skipped) {
    return;
  }

  if (storedActivity.created) {
    counters.activitiesCreated += 1;
  } else if (storedActivity.updated) {
    counters.activitiesUpdated += 1;
  }

  const artifactSyncInput = {
    activityId,
    apiKey,
    artifactStore,
    coreActivityId: storedActivity.activityId,
    client,
    errors,
    externalActivityId: storedActivity.externalActivityId,
    providerActivityId: storedActivity.providerActivityId,
    syncRunId,
    signal,
    userId,
  };

  await syncIntervalsIcuActivityMap(artifactSyncInput);
  await syncIntervalsIcuActivityStreams(artifactSyncInput);
}

function readField(cause: unknown, field: "details" | "requestUrl") {
  if (typeof cause !== "object" || cause === null || !(field in cause)) {
    return undefined;
  }
  return (cause as Record<string, unknown>)[field];
}

function readStringField(cause: unknown, field: "requestUrl") {
  const value = readField(cause, field);
  return typeof value === "string" ? value : undefined;
}
