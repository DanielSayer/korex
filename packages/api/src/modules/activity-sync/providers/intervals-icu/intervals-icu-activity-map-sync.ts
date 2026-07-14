import type { IntervalsIcuClientService } from "@korex/integrations/intervals-icu/client";
import { getIntervalsIcuActivityMapRequestUrl } from "@korex/integrations/intervals-icu/urls";
import type { ActivityArtifactStoreService } from "../../activity-sync.dependencies";
import { ActivitySyncError } from "../../activity-sync.errors";
import type { ActivitySyncFailure } from "../../activity-sync.types";
import { toActivityMapFromIntervalsIcuMap } from "./intervals-icu-activity-map.acl";
import {
  getErrorDetails,
  getProviderPayloadDetails,
} from "./intervals-icu-sync-errors";

export async function syncIntervalsIcuActivityMap({
  apiKey,
  artifactStore,
  coreActivityId,
  client,
  errors,
  externalActivityId,
  providerActivityId,
  providerRequestActivityId,
  syncRunId,
  signal,
  userId,
}: {
  apiKey: string;
  artifactStore: ActivityArtifactStoreService;
  coreActivityId: number;
  client: IntervalsIcuClientService;
  errors: ActivitySyncFailure[];
  externalActivityId: number;
  providerActivityId: string;
  providerRequestActivityId: string;
  syncRunId: number;
  signal?: AbortSignal;
  userId: string;
}) {
  let mapResult: Awaited<
    ReturnType<IntervalsIcuClientService["getActivityMap"]>
  >;
  try {
    mapResult = await client.getActivityMap({
      activityId: providerRequestActivityId,
      apiKey,
      signal,
    });
  } catch (cause) {
    signal?.throwIfAborted();
    errors.push({
      activityId: providerRequestActivityId,
      details: getErrorDetails(cause),
      message:
        cause instanceof Error ? cause.message : "Failed to fetch activity map",
      requestUrl: isClientError(cause) ? cause.requestUrl : undefined,
      stage: "map",
    });
    return;
  }

  if (mapResult === null) {
    return;
  }

  try {
    await artifactStore.storeExternalMap({
      externalActivityId,
      lastSyncRunId: syncRunId,
      provider: "intervals_icu",
      providerActivityId,
      rawData: mapResult,
      userId,
    });
  } catch (cause) {
    throw new ActivitySyncError({
      cause,
      message: "Failed to store external activity map",
    });
  }

  const activityMap = readActivityMapAclResult({
    activityId: providerRequestActivityId,
    errors,
    map: mapResult,
    requestUrl: getIntervalsIcuActivityMapRequestUrl(providerRequestActivityId),
  });

  if (!activityMap) {
    return;
  }

  try {
    await artifactStore.replaceCoreMap({
      activityId: coreActivityId,
      map: activityMap,
    });
  } catch (cause) {
    throw new ActivitySyncError({
      cause,
      message: "Failed to store activity map",
    });
  }
}

function isClientError(value: unknown): value is { requestUrl?: string } {
  return typeof value === "object" && value !== null && "requestUrl" in value;
}

function readActivityMapAclResult({
  activityId,
  errors,
  map,
  requestUrl,
}: {
  activityId: string;
  errors: ActivitySyncFailure[];
  map: unknown;
  requestUrl: string;
}) {
  try {
    return toActivityMapFromIntervalsIcuMap(map);
  } catch (error) {
    errors.push({
      activityId,
      details: getErrorDetails(error) ?? getProviderPayloadDetails(map),
      message:
        error instanceof Error
          ? error.message
          : "Failed to translate activity map",
      requestUrl,
      stage: "map",
    });
    return null;
  }
}
