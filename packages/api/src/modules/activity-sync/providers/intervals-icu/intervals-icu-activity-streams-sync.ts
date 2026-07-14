import type {
  IntervalsIcuActivityStreams,
  IntervalsIcuClientService,
} from "@korex/integrations/intervals-icu/client";
import { getIntervalsIcuActivityStreamsRequestUrl } from "@korex/integrations/intervals-icu/urls";
import type { ActivityArtifactStoreService } from "../../activity-sync.dependencies";
import { ActivitySyncError } from "../../activity-sync.errors";
import type { ActivitySyncFailure } from "../../activity-sync.types";
import { toActivityStreamsFromIntervalsIcuStreams } from "./intervals-icu-activity-streams.acl";
import {
  getErrorDetails,
  getProviderPayloadDetails,
  isRecord,
} from "./intervals-icu-sync-errors";

export async function syncIntervalsIcuActivityStreams({
  activityId,
  apiKey,
  artifactStore,
  client,
  coreActivityId,
  errors,
  externalActivityId,
  providerActivityId,
  syncRunId,
  signal,
  userId,
}: {
  activityId: string;
  apiKey: string;
  artifactStore: ActivityArtifactStoreService;
  client: IntervalsIcuClientService;
  coreActivityId: number;
  errors: ActivitySyncFailure[];
  externalActivityId: number;
  providerActivityId: string;
  syncRunId: number;
  signal?: AbortSignal;
  userId: string;
}) {
  let streamsResult: Awaited<
    ReturnType<IntervalsIcuClientService["getActivityStreams"]>
  >;
  try {
    streamsResult = await client.getActivityStreams({
      activityId,
      apiKey,
      signal,
    });
  } catch (cause) {
    signal?.throwIfAborted();
    errors.push({
      activityId,
      details: getErrorDetails(cause),
      message:
        cause instanceof Error
          ? cause.message
          : "Failed to fetch activity streams",
      requestUrl: isClientError(cause) ? cause.requestUrl : undefined,
      stage: "streams",
    });
    return;
  }

  if (streamsResult === null) {
    return;
  }

  for (const [streamType, rawData] of readRawStreamEntries(streamsResult)) {
    try {
      await artifactStore.storeExternalStream({
        externalActivityId,
        lastSyncRunId: syncRunId,
        provider: "intervals_icu",
        providerActivityId,
        rawData,
        streamType,
        userId,
      });
    } catch (cause) {
      throw new ActivitySyncError({
        cause,
        message: "Failed to store external activity stream",
      });
    }
  }

  const activityStreams = readActivityStreamsAclResult({
    activityId,
    errors,
    requestUrl: getIntervalsIcuActivityStreamsRequestUrl(activityId),
    streams: streamsResult,
  });

  if (!activityStreams) {
    return;
  }

  try {
    await artifactStore.replaceCoreStreamsAndQueueCalculation({
      activityId: coreActivityId,
      streams: activityStreams,
      userId,
    });
  } catch (cause) {
    throw new ActivitySyncError({
      cause,
      message: "Failed to store activity streams",
    });
  }
}

function isClientError(value: unknown): value is { requestUrl?: string } {
  return typeof value === "object" && value !== null && "requestUrl" in value;
}

function readActivityStreamsAclResult({
  activityId,
  errors,
  streams,
  requestUrl,
}: {
  activityId: string;
  errors: ActivitySyncFailure[];
  requestUrl: string;
  streams: IntervalsIcuActivityStreams;
}) {
  try {
    return toActivityStreamsFromIntervalsIcuStreams(streams);
  } catch (error) {
    errors.push({
      activityId,
      details: getErrorDetails(error) ?? getProviderPayloadDetails(streams),
      message:
        error instanceof Error
          ? error.message
          : "Failed to translate activity streams",
      requestUrl,
      stage: "streams",
    });
    return null;
  }
}

function readRawStreamEntries(
  streams: IntervalsIcuActivityStreams,
): [string, unknown][] {
  if (Array.isArray(streams)) {
    return streams.map((stream, index) => [
      readRawStreamType(stream) ?? String(index),
      stream,
    ]);
  }

  return Object.entries(streams);
}

function readRawStreamType(stream: unknown) {
  if (!isRecord(stream) || typeof stream.type !== "string") {
    return null;
  }

  return stream.type;
}
