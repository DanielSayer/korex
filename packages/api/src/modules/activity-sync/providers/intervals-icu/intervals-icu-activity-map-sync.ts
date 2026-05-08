import type { IntervalsIcuClientService } from "@korex/integrations/intervals-icu/client";
import { getIntervalsIcuActivityMapRequestUrl } from "@korex/integrations/intervals-icu/urls";
import { Effect, Either } from "effect";
import { ActivityArtifactStore } from "../../activity-sync.dependencies";
import { ActivitySyncError } from "../../activity-sync.errors";
import type { ActivitySyncFailure } from "../../activity-sync.types";
import { toActivityMapFromIntervalsIcuMap } from "./intervals-icu-activity-map.acl";
import {
  getErrorDetails,
  getProviderPayloadDetails,
} from "./intervals-icu-sync-errors";

export function syncIntervalsIcuActivityMap({
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
      requestUrl: getIntervalsIcuActivityMapRequestUrl(
        providerRequestActivityId,
      ),
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
