import type {
  IntervalsIcuActivityStreams,
  IntervalsIcuClientService,
} from "@korex/integrations/intervals-icu/client";
import { getIntervalsIcuRequestUrl } from "@korex/integrations/intervals-icu/http-client";
import { Effect, Either } from "effect";
import { ActivityArtifactStore } from "../../activity-sync.dependencies";
import { ActivitySyncError } from "../../activity-sync.errors";
import type {
  ActivitySyncCounters,
  ActivitySyncFailure,
} from "../../activity-sync.types";
import { storeIntervalsIcuActivityImport } from "./intervals-icu-activity-import";
import { toActivityMapFromIntervalsIcuMap } from "./intervals-icu-activity-map.acl";
import { toActivityStreamsFromIntervalsIcuStreams } from "./intervals-icu-activity-streams.acl";

export function syncIntervalsIcuActivity({
  activityId,
  apiKey,
  athleteId,
  client,
  counters,
  errors,
  syncRunId,
  userId,
}: {
  activityId: string;
  apiKey: string;
  athleteId: string;
  client: IntervalsIcuClientService;
  counters: ActivitySyncCounters;
  errors: ActivitySyncFailure[];
  syncRunId: number;
  userId: string;
}) {
  return Effect.gen(function* () {
    const detailResult = yield* Effect.either(
      client.getActivityDetail({
        activityId,
        apiKey,
      }),
    );

    if (Either.isLeft(detailResult)) {
      errors.push({
        activityId,
        details: detailResult.left.details,
        message: detailResult.left.message,
        requestUrl: detailResult.left.requestUrl,
        stage: "detail",
      });
      return;
    }

    const storedActivity = yield* storeIntervalsIcuActivityImport({
      detail: detailResult.right,
      errors,
      lastSyncRunId: syncRunId,
      providerAthleteId: athleteId,
      userId,
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

    yield* syncIntervalsIcuActivityMap({
      apiKey,
      coreActivityId: storedActivity.activityId,
      client,
      errors,
      externalActivityId: storedActivity.externalActivityId,
      providerActivityId: storedActivity.providerActivityId,
      providerRequestActivityId: activityId,
      syncRunId,
      userId,
    });

    yield* syncIntervalsIcuActivityStreams({
      activityId,
      apiKey,
      client,
      coreActivityId: storedActivity.activityId,
      errors,
      externalActivityId: storedActivity.externalActivityId,
      providerActivityId: storedActivity.providerActivityId,
      syncRunId,
      userId,
    });
  });
}

function syncIntervalsIcuActivityMap({
  apiKey,
  coreActivityId,
  client,
  errors,
  externalActivityId,
  providerActivityId,
  providerRequestActivityId,
  syncRunId,
  userId,
}: {
  apiKey: string;
  coreActivityId: number;
  client: IntervalsIcuClientService;
  errors: ActivitySyncFailure[];
  externalActivityId: number;
  providerActivityId: string;
  providerRequestActivityId: string;
  syncRunId: number;
  userId: string;
}) {
  return Effect.gen(function* () {
    const artifactStore = yield* ActivityArtifactStore;
    const mapResult = yield* Effect.either(
      client.getActivityMap({
        activityId: providerRequestActivityId,
        apiKey,
      }),
    );

    if (Either.isLeft(mapResult)) {
      errors.push({
        activityId: providerRequestActivityId,
        details: mapResult.left.details,
        message: mapResult.left.message,
        requestUrl: mapResult.left.requestUrl,
        stage: "map",
      });
      return;
    }

    if (mapResult.right === null) {
      return;
    }

    yield* Effect.tryPromise({
      try: () =>
        artifactStore.storeExternalMap({
          externalActivityId,
          lastSyncRunId: syncRunId,
          provider: "intervals_icu",
          providerActivityId,
          rawData: mapResult.right,
          userId,
        }),
      catch: (cause) =>
        new ActivitySyncError({
          cause,
          message: "Failed to store external activity map",
        }),
    });

    const activityMap = readActivityMapAclResult({
      activityId: providerRequestActivityId,
      errors,
      map: mapResult.right,
      requestUrl: getActivityMapRequestUrl(providerRequestActivityId),
    });

    if (!activityMap) {
      return;
    }

    yield* Effect.tryPromise({
      try: () =>
        artifactStore.replaceCoreMap({
          activityId: coreActivityId,
          map: activityMap,
        }),
      catch: (cause) =>
        new ActivitySyncError({
          cause,
          message: "Failed to store activity map",
        }),
    });
  });
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
      details: getProviderPayloadDetails(map),
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

function syncIntervalsIcuActivityStreams({
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

    for (const [streamType, rawData] of Object.entries(streamsResult.right)) {
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
      requestUrl: getActivityStreamsRequestUrl(activityId),
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
      details: getProviderPayloadDetails(streams),
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

function getActivityMapRequestUrl(activityId: string) {
  return getIntervalsIcuRequestUrl(
    `/api/v1/activity/${encodeURIComponent(activityId)}/map`,
  );
}

function getActivityStreamsRequestUrl(activityId: string) {
  return getIntervalsIcuRequestUrl(
    `/api/v1/activity/${encodeURIComponent(activityId)}/streams.json`,
  );
}

type ProviderPayloadDetails =
  | {
      length: number;
      sample: ProviderPayloadDetails[];
      type: "array";
    }
  | {
      keys: string[];
      keyCount: number;
      type: "object";
    }
  | {
      type: string;
    };

function getProviderPayloadDetails(value: unknown): ProviderPayloadDetails {
  if (Array.isArray(value)) {
    return {
      length: value.length,
      sample: value.slice(0, 3).map(getProviderPayloadDetails),
      type: "array",
    };
  }

  if (isRecord(value)) {
    const keys = Object.keys(value);

    return {
      keys: keys.slice(0, 20),
      keyCount: keys.length,
      type: "object",
    };
  }

  return {
    type: value === null ? "null" : typeof value,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
