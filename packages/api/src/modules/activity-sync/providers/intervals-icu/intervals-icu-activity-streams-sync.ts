import type {
  IntervalsIcuActivityStreams,
  IntervalsIcuClientService,
} from "@korex/integrations/intervals-icu/client";
import { getIntervalsIcuActivityStreamsRequestUrl } from "@korex/integrations/intervals-icu/urls";
import { Effect, Either } from "effect";
import { ActivityArtifactStore } from "../../activity-sync.dependencies";
import { ActivitySyncError } from "../../activity-sync.errors";
import type { ActivitySyncFailure } from "../../activity-sync.types";
import { toActivityStreamsFromIntervalsIcuStreams } from "./intervals-icu-activity-streams.acl";
import {
  getErrorDetails,
  getProviderPayloadDetails,
  isRecord,
} from "./intervals-icu-sync-errors";

export function syncIntervalsIcuActivityStreams({
  activityId,
  apiKey,
  client,
  coreActivityId,
  errors,
  externalActivityId,
  providerActivityId,
  syncRunId,
  userId,
}: {
  activityId: string;
  apiKey: string;
  client: IntervalsIcuClientService;
  coreActivityId: number;
  errors: ActivitySyncFailure[];
  externalActivityId: number;
  providerActivityId: string;
  syncRunId: number;
  userId: string;
}) {
  return Effect.gen(function* () {
    const artifactStore = yield* ActivityArtifactStore;
    const streamsResult = yield* Effect.either(
      client.getActivityStreams({
        activityId,
        apiKey,
      }),
    );

    if (Either.isLeft(streamsResult)) {
      errors.push({
        activityId,
        details: streamsResult.left.details,
        message: streamsResult.left.message,
        requestUrl: streamsResult.left.requestUrl,
        stage: "streams",
      });
      return;
    }

    if (streamsResult.right === null) {
      return;
    }

    for (const [streamType, rawData] of readRawStreamEntries(
      streamsResult.right,
    )) {
      yield* Effect.tryPromise({
        try: () =>
          artifactStore.storeExternalStream({
            externalActivityId,
            lastSyncRunId: syncRunId,
            provider: "intervals_icu",
            providerActivityId,
            rawData,
            streamType,
            userId,
          }),
        catch: (cause) =>
          new ActivitySyncError({
            cause,
            message: "Failed to store external activity stream",
          }),
      });
    }

    const activityStreams = readActivityStreamsAclResult({
      activityId,
      errors,
      requestUrl: getIntervalsIcuActivityStreamsRequestUrl(activityId),
      streams: streamsResult.right,
    });

    if (!activityStreams) {
      return;
    }

    yield* Effect.tryPromise({
      try: () =>
        artifactStore.replaceCoreStreamsAndQueueCalculation({
          activityId: coreActivityId,
          streams: activityStreams,
          userId,
        }),
      catch: (cause) =>
        new ActivitySyncError({
          cause,
          message: "Failed to store activity streams",
        }),
    });
  });
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
