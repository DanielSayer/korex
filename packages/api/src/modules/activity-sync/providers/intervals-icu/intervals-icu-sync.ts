import type { IntervalsIcuClientService } from "@korex/integrations/intervals-icu/client";
import { Effect, Either } from "effect";
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
      activityId,
      apiKey,
      client,
      errors,
      externalActivityId: storedActivity.externalActivityId,
      providerActivityId: storedActivity.providerActivityId,
      syncRunId,
      userId,
    });

    yield* syncIntervalsIcuActivityStreams({
      activityId,
      apiKey,
      client,
      errors,
      externalActivityId: storedActivity.externalActivityId,
      providerActivityId: storedActivity.providerActivityId,
      syncRunId,
      userId,
    });
  });
}

function syncIntervalsIcuActivityMap({
  activityId,
  apiKey,
  client,
  errors,
  externalActivityId,
  providerActivityId,
  syncRunId,
  userId,
}: {
  activityId: string;
  apiKey: string;
  client: IntervalsIcuClientService;
  errors: ActivitySyncFailure[];
  externalActivityId: number;
  providerActivityId: string;
  syncRunId: number;
  userId: string;
}) {
  return Effect.gen(function* () {
    const mapResult = yield* Effect.either(
      client.getActivityMap({
        activityId,
        apiKey,
      }),
    );

    if (Either.isLeft(mapResult)) {
      errors.push({
        activityId,
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
  });
}

function syncIntervalsIcuActivityStreams({
  activityId,
  apiKey,
  client,
  errors,
  externalActivityId,
  providerActivityId,
  syncRunId,
  userId,
}: {
  activityId: string;
  apiKey: string;
  client: IntervalsIcuClientService;
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
  });
}
