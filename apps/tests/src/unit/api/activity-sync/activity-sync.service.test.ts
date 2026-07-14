import type {
  ActivitySyncRepositoryService,
  IntervalsIcuActivitySyncService,
} from "@korex/api/modules/activity-sync/activity-sync.dependencies";
import { createActivitySyncModule } from "@korex/api/modules/activity-sync/activity-sync.service";
import type { ActivitySyncFailure } from "@korex/api/modules/activity-sync/activity-sync.types";
import type { ProviderSessionService } from "@korex/api/modules/provider-connections/provider-session";
import {
  IntervalsIcuClientError,
  type IntervalsIcuClientService,
} from "@korex/integrations/intervals-icu/client";
import { describe, expect, it } from "vitest";

describe("fetchIntervalsIcuActivities", () => {
  it("marks the provider connection synced to the requested end date after a successful sync", async () => {
    const repository = createSyncRepositoryRecorder();
    const result = await runFetchIntervalsIcuActivities({
      client: createClient(async () => [{ id: "activity-1" }]),
      repository,
      syncActivity: createSyncActivity({
        "activity-1": ({ counters }) => {
          counters.activitiesStored += 1;
          counters.activitiesCreated += 1;
        },
      }),
    });

    expect(result).toMatchObject({
      activitiesCreated: 1,
      activitiesSeen: 1,
      status: "success",
    });
    expect(repository.syncedConnections).toEqual([
      {
        connectionId: 456,
        syncedAt: new Date("2026-04-02T00:00:00.000Z"),
      },
    ]);
  });

  it("finishes the sync run as failed when listing activities fails", async () => {
    const repository = createSyncRepositoryRecorder();
    await expect(
      runFetchIntervalsIcuActivities({
        client: createClient(async () => {
          throw new IntervalsIcuClientError({
            message: "Intervals.icu list failed",
            requestUrl:
              "https://intervals.icu/api/v1/athlete/athlete-1/activities?oldest=2026-04-01&newest=2026-04-02",
            status: 502,
          });
        }),
        repository,
        syncActivity: createSyncActivity({}),
      }),
    ).rejects.toMatchObject({ message: "Intervals.icu list failed" });

    expect(repository.finishedRuns).toEqual([
      expect.objectContaining({
        activitiesCreated: 0,
        activitiesSeen: 0,
        activitiesUpdated: 0,
        errorCode: "list",
        errorMessage: "Intervals.icu list failed",
        metadata: {
          errors: [
            {
              message: "Intervals.icu list failed",
              requestUrl:
                "https://intervals.icu/api/v1/athlete/athlete-1/activities?oldest=2026-04-01&newest=2026-04-02",
              stage: "list",
            },
          ],
        },
        status: "failed",
        syncRunId: 123,
      }),
    ]);
  });

  it("returns failed when every listed activity fails before storage", async () => {
    const repository = createSyncRepositoryRecorder();
    const result = await runFetchIntervalsIcuActivities({
      client: createClient(async () => [{ id: "activity-1" }]),
      repository,
      syncActivity: createSyncActivity({
        "activity-1": ({ errors }) =>
          errors.push({
            activityId: "activity-1",
            message: "detail failed",
            stage: "detail",
          }),
      }),
    });

    expect(result).toMatchObject({
      activitiesCreated: 0,
      activitiesSeen: 1,
      activitiesStored: 0,
      activitiesUpdated: 0,
      status: "failed",
      syncRunId: 123,
    });
    expect(repository.finishedRuns[0]).toMatchObject({
      activitiesSeen: 1,
      errorCode: "detail",
      status: "failed",
    });
  });

  it("returns partial when stored activity sync records map or stream errors", async () => {
    const repository = createSyncRepositoryRecorder();
    const result = await runFetchIntervalsIcuActivities({
      client: createClient(async () => [{ id: "activity-1" }]),
      repository,
      syncActivity: createSyncActivity({
        "activity-1": ({ counters, errors }) => {
          counters.activitiesStored += 1;
          counters.activitiesCreated += 1;
          errors.push({
            activityId: "activity-1",
            message: "map failed",
            stage: "map",
          });
        },
      }),
    });

    expect(result).toMatchObject({
      activitiesCreated: 1,
      activitiesSeen: 1,
      activitiesStored: 1,
      status: "partial",
    });
    expect(repository.finishedRuns[0]).toMatchObject({
      errorCode: "map",
      status: "partial",
    });
  });

  it("keeps mixed success and failure counters when a later detail fetch fails", async () => {
    const repository = createSyncRepositoryRecorder();
    const result = await runFetchIntervalsIcuActivities({
      client: createClient(async () => [
        { id: "created-activity" },
        { id: "updated-activity" },
        { id: "failed-activity" },
      ]),
      repository,
      syncActivity: createSyncActivity({
        "created-activity": ({ counters }) => {
          counters.activitiesStored += 1;
          counters.activitiesCreated += 1;
        },
        "failed-activity": ({ errors }) =>
          errors.push({
            activityId: "failed-activity",
            message: "detail failed",
            stage: "detail",
          }),
        "updated-activity": ({ counters }) => {
          counters.activitiesStored += 1;
          counters.activitiesUpdated += 1;
        },
      }),
    });

    expect(result).toMatchObject({
      activitiesCreated: 1,
      activitiesSeen: 3,
      activitiesStored: 2,
      activitiesUpdated: 1,
      status: "partial",
    });
  });
});

function runFetchIntervalsIcuActivities({
  client,
  repository,
  syncActivity,
}: {
  client: IntervalsIcuClientService;
  repository: SyncRepositoryRecorder;
  syncActivity: IntervalsIcuActivitySyncService;
}) {
  return createActivitySyncModule({
    activitySyncRepository: createSyncRepository(repository),
    intervalsIcuActivitySync: syncActivity,
    intervalsIcuClient: client,
    providerSession: createProviderSession(),
  }).fetchIntervalsIcuActivities({
    endDate: new Date("2026-04-02T00:00:00.000Z"),
    startDate: new Date("2026-04-01T00:00:00.000Z"),
    userId: "user-1",
  });
}

type SyncActivityHandler = (input: {
  counters: {
    activitiesCreated: number;
    activitiesSeen: number;
    activitiesStored: number;
    activitiesUpdated: number;
  };
  errors: ActivitySyncFailure[];
}) => void;

function createSyncActivity(
  handlers: Record<string, SyncActivityHandler>,
): IntervalsIcuActivitySyncService {
  return {
    syncActivity: async ({ activityId, counters, errors }) => {
      handlers[activityId]?.({ counters, errors });
    },
  };
}

function createClient(
  listActivities: IntervalsIcuClientService["listActivities"],
): IntervalsIcuClientService {
  const unused = async (): Promise<never> => {
    throw new Error("unused");
  };
  return {
    getActivityDetail: unused,
    getActivityMap: unused,
    getActivityStreams: unused,
    getAthleteProfile: unused,
    listActivities,
  };
}

function createProviderSession(): ProviderSessionService {
  return {
    getActiveProviderSession: async () => ({
      apiKey: "api-key",
      authType: "basic",
      connectionId: 456,
      provider: "intervals_icu",
      providerUserId: "athlete-1",
    }),
    getActiveProviderSessionForUser: async () => {
      throw new Error("unused");
    },
  };
}

type FinishedSyncRun = Parameters<
  ActivitySyncRepositoryService["finishActivitySyncRun"]
>[0];
type SyncRepositoryRecorder = {
  finishedRuns: FinishedSyncRun[];
  syncedConnections: Array<{ connectionId: number; syncedAt: Date }>;
};

function createSyncRepositoryRecorder(): SyncRepositoryRecorder {
  return { finishedRuns: [], syncedConnections: [] };
}

function createSyncRepository(
  recorder: SyncRepositoryRecorder,
): ActivitySyncRepositoryService {
  return {
    createActivitySyncRun: async () => ({ id: 123 }),
    finishActivitySyncRun: async (input) => {
      recorder.finishedRuns.push(input);
    },
    getLatestIncrementalActivitySyncRunForUser: async () => null,
    getLatestSuccessfulActivitySyncRunForUser: async () => null,
    hasSuccessfulActivitySyncRunForUser: async () => false,
    markProviderConnectionSynced: async (input) => {
      recorder.syncedConnections.push(input);
    },
  };
}
