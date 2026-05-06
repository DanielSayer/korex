import type {
  IntervalsIcuActivityStreams,
  IntervalsIcuClientService,
} from "@korex/integrations/intervals-icu/client";
import { Effect, Either } from "effect";
import {
  replaceActivityMap,
  replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation,
} from "../../../activities/activities.repository";
import { ActivitySyncError } from "../../activity-sync.errors";
import type {
  ActivitySyncCounters,
  ActivitySyncFailure,
} from "../../activity-sync.types";
import {
  upsertExternalActivityMap,
  upsertExternalActivityStream,
} from "../../repositories/external-activities.repository";
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
        message: detailResult.left.message,
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
    const mapResult = yield* Effect.either(
      client.getActivityMap({
        activityId: providerRequestActivityId,
        apiKey,
      }),
    );

    if (Either.isLeft(mapResult)) {
      errors.push({
        activityId: providerRequestActivityId,
        message: mapResult.left.message,
        stage: "map",
      });
      return;
    }

    if (mapResult.right === null) {
      return;
    }

    yield* Effect.tryPromise({
      try: () =>
        upsertExternalActivityMap({
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
    });

    if (!activityMap) {
      return;
    }

    yield* Effect.tryPromise({
      try: () =>
        replaceActivityMap({
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
}: {
  activityId: string;
  errors: ActivitySyncFailure[];
  map: unknown;
}) {
  try {
    return toActivityMapFromIntervalsIcuMap(map);
  } catch (error) {
    errors.push({
      activityId,
      message:
        error instanceof Error
          ? error.message
          : "Failed to translate activity map",
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
    const streamsResult = yield* Effect.either(
      client.getActivityStreams({
        activityId,
        apiKey,
      }),
    );

    if (Either.isLeft(streamsResult)) {
      errors.push({
        activityId,
        message: streamsResult.left.message,
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
          upsertExternalActivityStream({
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
      streams: streamsResult.right,
    });

    if (!activityStreams) {
      return;
    }

    yield* Effect.tryPromise({
      try: () =>
        replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation({
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
}: {
  activityId: string;
  errors: ActivitySyncFailure[];
  streams: IntervalsIcuActivityStreams;
}) {
  try {
    return toActivityStreamsFromIntervalsIcuStreams(streams);
  } catch (error) {
    errors.push({
      activityId,
      message:
        error instanceof Error
          ? error.message
          : "Failed to translate activity streams",
      stage: "streams",
    });
    return null;
  }
}
