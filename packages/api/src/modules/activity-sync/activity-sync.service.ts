import { IntervalsIcuClient } from "@korex/integrations/intervals-icu/client";
import { Effect } from "effect";
import { ProviderSessionContext } from "../provider-connections/provider-session";
import {
  ActivitySyncRepository,
  type ActivitySyncRepositoryService,
  IntervalsIcuActivitySync,
} from "./activity-sync.dependencies";
import { ActivitySyncError } from "./activity-sync.errors";
import type {
  ActivitySyncCounters,
  ActivitySyncFailure,
  FetchIntervalsIcuActivitiesInput,
} from "./activity-sync.types";

export type {
  FetchIntervalsIcuActivitiesInput,
  FetchIntervalsIcuActivitiesResult,
} from "./activity-sync.types";

export function fetchIntervalsIcuActivities({
  endDate,
  startDate,
  userId,
}: FetchIntervalsIcuActivitiesInput) {
  return Effect.gen(function* () {
    const repository = yield* ActivitySyncRepository;
    const providerSession = yield* ProviderSessionContext;
    const activitySync = yield* IntervalsIcuActivitySync;
    const intervalsIcuClient = yield* IntervalsIcuClient;

    const session = yield* providerSession.getActiveProviderSession({
      provider: "intervals_icu",
      userId,
    });

    const syncRun = yield* Effect.promise(() =>
      repository.createActivitySyncRun({
        provider: session.provider,
        syncType: "manual",
        userId,
      }),
    );

    const counters = createActivitySyncCounters();
    const errors: ActivitySyncFailure[] = [];

    const activityList = yield* intervalsIcuClient
      .listActivities({
        apiKey: session.apiKey,
        athleteId: session.providerUserId,
        endDate,
        startDate,
      })
      .pipe(
        Effect.catchAll((cause) =>
          failActivitySyncRun({
            counters,
            errors,
            failure: {
              message: cause.message,
              stage: "list",
            },
            repository,
            syncRunId: syncRun.id,
          }),
        ),
      );

    counters.activitiesSeen = activityList.length;

    for (const activityListItem of activityList) {
      yield* activitySync.syncActivity({
        activityId: String(activityListItem.id),
        apiKey: session.apiKey,
        athleteId: session.providerUserId,
        client: intervalsIcuClient,
        counters,
        errors,
        syncRunId: syncRun.id,
        userId,
      });
    }

    const status = getActivitySyncStatus(counters, errors);

    yield* Effect.promise(() =>
      repository.finishActivitySyncRun({
        activitiesCreated: counters.activitiesCreated,
        activitiesSeen: counters.activitiesSeen,
        activitiesUpdated: counters.activitiesUpdated,
        errorCode: errors[0]?.stage,
        errorMessage: errors[0]?.message,
        metadata: { errors },
        status,
        syncRunId: syncRun.id,
      }),
    );

    return {
      ...counters,
      errors,
      status,
      syncRunId: syncRun.id,
    };
  });
}

function createActivitySyncCounters(): ActivitySyncCounters {
  return {
    activitiesCreated: 0,
    activitiesSeen: 0,
    activitiesStored: 0,
    activitiesUpdated: 0,
  };
}

function failActivitySyncRun({
  counters,
  errors,
  failure,
  repository,
  syncRunId,
}: {
  counters: ActivitySyncCounters;
  errors: ActivitySyncFailure[];
  failure: ActivitySyncFailure;
  repository: ActivitySyncRepositoryService;
  syncRunId: number;
}) {
  return Effect.gen(function* () {
    errors.push(failure);
    yield* Effect.promise(() =>
      repository.finishActivitySyncRun({
        activitiesCreated: counters.activitiesCreated,
        activitiesSeen: counters.activitiesSeen,
        activitiesUpdated: counters.activitiesUpdated,
        errorCode: failure.stage,
        errorMessage: failure.message,
        metadata: { errors },
        status: "failed",
        syncRunId,
      }),
    );

    return yield* Effect.fail(
      new ActivitySyncError({ message: failure.message }),
    );
  });
}

function getActivitySyncStatus(
  counters: ActivitySyncCounters,
  errors: ActivitySyncFailure[],
) {
  if (counters.activitiesStored === 0 && errors.length > 0) {
    return "failed";
  }

  if (errors.length > 0) {
    return "partial";
  }

  return "success";
}
