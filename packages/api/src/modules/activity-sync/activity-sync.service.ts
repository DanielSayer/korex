import type { IntervalsIcuClientService } from "@korex/integrations/intervals-icu/client";
import type {
  Provider,
  ProviderSession,
  ProviderSessionService,
} from "../provider-connections/provider-session";
import type {
  ActivitySyncRepositoryService,
  IntervalsIcuActivitySyncService,
} from "./activity-sync.dependencies";
import {
  ActivitySyncError,
  ActivitySyncProviderNotSupportedError,
} from "./activity-sync.errors";
import type {
  ActivitySyncCounters,
  ActivitySyncFailure,
  FetchIntervalsIcuActivitiesInput,
  FetchIntervalsIcuActivitiesResult,
  SyncUserActivitiesInput,
} from "./activity-sync.types";

export type {
  FetchIntervalsIcuActivitiesInput,
  FetchIntervalsIcuActivitiesResult,
  SyncUserActivitiesInput,
} from "./activity-sync.types";

export type ActivitySyncModule = {
  fetchIntervalsIcuActivities: (
    input: FetchIntervalsIcuActivitiesInput,
  ) => Promise<FetchIntervalsIcuActivitiesResult>;
  syncUserActivities: (
    input: SyncUserActivitiesInput,
  ) => Promise<FetchIntervalsIcuActivitiesResult>;
};

export type ActivitySyncDependencies = {
  activitySyncRepository: ActivitySyncRepositoryService;
  intervalsIcuActivitySync: IntervalsIcuActivitySyncService;
  intervalsIcuClient: IntervalsIcuClientService;
  providerSession: ProviderSessionService;
};

export function createActivitySyncModule(
  dependencies: ActivitySyncDependencies,
): ActivitySyncModule {
  return {
    fetchIntervalsIcuActivities: async (input) => {
      const session =
        await dependencies.providerSession.getActiveProviderSession({
          provider: "intervals_icu",
          userId: input.userId,
        });
      return fetchIntervalsIcuActivitiesForSession(
        input,
        session,
        dependencies,
      );
    },
    syncUserActivities: async (input) => {
      const session =
        await dependencies.providerSession.getActiveProviderSessionForUser({
          userId: input.userId,
        });

      switch (getActivitySyncProvider(session.provider)) {
        case "intervals_icu":
          return fetchIntervalsIcuActivitiesForSession(
            input,
            session,
            dependencies,
          );
      }
    },
  };
}

export function getActivitySyncProvider(provider: Provider) {
  switch (provider) {
    case "intervals_icu":
      return provider;
    default:
      throw new ActivitySyncProviderNotSupportedError({ provider });
  }
}

async function fetchIntervalsIcuActivitiesForSession(
  {
    endDate,
    signal,
    startDate,
    syncRunId,
    syncType = "manual",
    userId,
  }: FetchIntervalsIcuActivitiesInput,
  session: ProviderSession,
  {
    activitySyncRepository,
    intervalsIcuActivitySync,
    intervalsIcuClient,
  }: ActivitySyncDependencies,
): Promise<FetchIntervalsIcuActivitiesResult> {
  signal?.throwIfAborted();
  const syncRun =
    syncRunId !== undefined
      ? { id: syncRunId }
      : await activitySyncRepository.createActivitySyncRun({
          provider: session.provider,
          syncType,
          userId,
        });
  const counters = createActivitySyncCounters();
  const errors: ActivitySyncFailure[] = [];

  let activityList: Awaited<
    ReturnType<IntervalsIcuClientService["listActivities"]>
  > = [];
  try {
    activityList = await intervalsIcuClient.listActivities({
      apiKey: session.apiKey,
      athleteId: session.providerUserId,
      endDate,
      signal,
      startDate,
    });
  } catch (cause) {
    signal?.throwIfAborted();
    const failure: ActivitySyncFailure = {
      message:
        cause instanceof Error ? cause.message : "Failed to list activities",
      requestUrl: readStringField(cause, "requestUrl"),
      stage: "list",
    };
    await failActivitySyncRun({
      activitySyncRepository,
      counters,
      errors,
      failure,
      syncRunId: syncRun.id,
    });
  }

  counters.activitiesSeen = activityList.length;
  for (const activityListItem of activityList) {
    signal?.throwIfAborted();
    await intervalsIcuActivitySync.syncActivity({
      activityId: String(activityListItem.id),
      apiKey: session.apiKey,
      athleteId: session.providerUserId,
      client: intervalsIcuClient,
      counters,
      errors,
      signal,
      syncRunId: syncRun.id,
      userId,
    });
  }

  const status = getActivitySyncStatus(counters, errors);
  await activitySyncRepository.finishActivitySyncRun({
    activitiesCreated: counters.activitiesCreated,
    activitiesSeen: counters.activitiesSeen,
    activitiesUpdated: counters.activitiesUpdated,
    errorCode: errors[0]?.stage,
    errorMessage: errors[0]?.message,
    metadata: { errors },
    status,
    syncRunId: syncRun.id,
  });

  if (status === "success") {
    await activitySyncRepository.markProviderConnectionSynced({
      connectionId: session.connectionId,
      syncedAt: endDate,
    });
  }

  return { ...counters, errors, status, syncRunId: syncRun.id };
}

function createActivitySyncCounters(): ActivitySyncCounters {
  return {
    activitiesCreated: 0,
    activitiesSeen: 0,
    activitiesStored: 0,
    activitiesUpdated: 0,
  };
}

async function failActivitySyncRun({
  activitySyncRepository,
  counters,
  errors,
  failure,
  syncRunId,
}: {
  activitySyncRepository: ActivitySyncRepositoryService;
  counters: ActivitySyncCounters;
  errors: ActivitySyncFailure[];
  failure: ActivitySyncFailure;
  syncRunId: number;
}): Promise<never> {
  errors.push(failure);
  await activitySyncRepository.finishActivitySyncRun({
    activitiesCreated: counters.activitiesCreated,
    activitiesSeen: counters.activitiesSeen,
    activitiesUpdated: counters.activitiesUpdated,
    errorCode: failure.stage,
    errorMessage: failure.message,
    metadata: { errors },
    status: "failed",
    syncRunId,
  });
  throw new ActivitySyncError({ message: failure.message });
}

function getActivitySyncStatus(
  counters: ActivitySyncCounters,
  errors: ActivitySyncFailure[],
) {
  if (counters.activitiesStored === 0 && errors.length > 0) {
    return "failed" as const;
  }
  if (errors.length > 0) {
    return "partial" as const;
  }
  return "success" as const;
}

function readStringField(value: unknown, field: string) {
  const record = value as Record<string, unknown>;
  if (
    typeof value !== "object" ||
    value === null ||
    !(field in value) ||
    typeof record[field] !== "string"
  ) {
    return undefined;
  }
  return record[field] as string;
}
