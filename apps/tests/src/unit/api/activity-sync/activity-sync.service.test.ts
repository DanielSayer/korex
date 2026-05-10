import {
  ActivitySyncRepository,
  IntervalsIcuActivitySync,
} from "@korex/api/modules/activity-sync/activity-sync.dependencies";
import { fetchIntervalsIcuActivities } from "@korex/api/modules/activity-sync/activity-sync.service";
import type { ActivitySyncFailure } from "@korex/api/modules/activity-sync/activity-sync.types";
import { ProviderSessionContext } from "@korex/api/modules/provider-connections/provider-session";
import {
  IntervalsIcuClient,
  IntervalsIcuClientError,
} from "@korex/integrations/intervals-icu/client";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

describe("fetchIntervalsIcuActivities", () => {
  it("marks the provider connection synced to the requested end date after a successful sync", async () => {
    const repository = createSyncRepositoryRecorder();
    const result = await runFetchIntervalsIcuActivities({
      clientLayer: createClientLayer({
        listActivities: Effect.succeed([{ id: "activity-1" }]),
      }),
      repository,
      syncActivityLayer: createSyncActivityLayer({
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
        clientLayer: createClientLayer({
          listActivities: Effect.fail(
            new IntervalsIcuClientError({
              message: "Intervals.icu list failed",
              requestUrl:
                "https://intervals.icu/api/v1/athlete/athlete-1/activities?oldest=2026-04-01&newest=2026-04-02",
              status: 502,
            }),
          ),
        }),
        repository,
        syncActivityLayer: createSyncActivityLayer({}),
      }),
    ).rejects.toMatchObject({
      message: "Intervals.icu list failed",
    });

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
    expect(repository.syncedConnections).toEqual([]);
  });

  it("returns failed when every listed activity fails before storage", async () => {
    const repository = createSyncRepositoryRecorder();
    const result = await runFetchIntervalsIcuActivities({
      clientLayer: createClientLayer({
        listActivities: Effect.succeed([{ id: "activity-1" }]),
      }),
      repository,
      syncActivityLayer: createSyncActivityLayer({
        "activity-1": ({ errors }) => {
          errors.push({
            activityId: "activity-1",
            message: "detail failed",
            stage: "detail",
          });
        },
      }),
    });

    expect(result).toMatchObject({
      activitiesCreated: 0,
      activitiesSeen: 1,
      activitiesStored: 0,
      activitiesUpdated: 0,
      errors: [
        {
          activityId: "activity-1",
          message: "detail failed",
          stage: "detail",
        },
      ],
      status: "failed",
      syncRunId: 123,
    });
    expect(repository.finishedRuns).toEqual([
      expect.objectContaining({
        activitiesSeen: 1,
        errorCode: "detail",
        errorMessage: "detail failed",
        status: "failed",
      }),
    ]);
    expect(repository.syncedConnections).toEqual([]);
  });

  it("returns partial when stored activity sync records map or stream errors", async () => {
    const repository = createSyncRepositoryRecorder();
    const result = await runFetchIntervalsIcuActivities({
      clientLayer: createClientLayer({
        listActivities: Effect.succeed([{ id: "activity-1" }]),
      }),
      repository,
      syncActivityLayer: createSyncActivityLayer({
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
      activitiesUpdated: 0,
      status: "partial",
    });
    expect(repository.finishedRuns).toEqual([
      expect.objectContaining({
        activitiesCreated: 1,
        activitiesSeen: 1,
        errorCode: "map",
        errorMessage: "map failed",
        status: "partial",
      }),
    ]);
    expect(repository.syncedConnections).toEqual([]);
  });

  it("keeps mixed success and failure counters when a later detail fetch fails", async () => {
    const repository = createSyncRepositoryRecorder();
    const result = await runFetchIntervalsIcuActivities({
      clientLayer: createClientLayer({
        listActivities: Effect.succeed([
          { id: "created-activity" },
          { id: "updated-activity" },
          { id: "failed-activity" },
        ]),
      }),
      repository,
      syncActivityLayer: createSyncActivityLayer({
        "created-activity": ({ counters }) => {
          counters.activitiesStored += 1;
          counters.activitiesCreated += 1;
        },
        "failed-activity": ({ errors }) => {
          errors.push({
            activityId: "failed-activity",
            message: "detail failed",
            stage: "detail",
          });
        },
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
    expect(repository.finishedRuns).toEqual([
      expect.objectContaining({
        activitiesCreated: 1,
        activitiesSeen: 3,
        activitiesUpdated: 1,
        errorCode: "detail",
        errorMessage: "detail failed",
        status: "partial",
      }),
    ]);
  });
});

function runFetchIntervalsIcuActivities({
  clientLayer,
  repository,
  syncActivityLayer,
}: {
  clientLayer: Layer.Layer<IntervalsIcuClient>;
  repository: SyncRepositoryRecorder;
  syncActivityLayer: Layer.Layer<IntervalsIcuActivitySync>;
}) {
  return Effect.runPromise(
    fetchIntervalsIcuActivities({
      endDate: new Date("2026-04-02T00:00:00.000Z"),
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      userId: "user-1",
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          clientLayer,
          createProviderSessionLayer(),
          createSyncRepositoryLayer(repository),
          syncActivityLayer,
        ),
      ),
    ),
  );
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

function createSyncActivityLayer(
  handlers: Record<string, SyncActivityHandler>,
) {
  return Layer.succeed(IntervalsIcuActivitySync, {
    syncActivity: ({ activityId, counters, errors }) => {
      handlers[activityId]?.({ counters, errors });
      return Effect.void;
    },
  });
}

function createClientLayer({
  listActivities,
}: {
  listActivities: Effect.Effect<{ id: string }[], IntervalsIcuClientError>;
}) {
  return Layer.succeed(IntervalsIcuClient, {
    getActivityDetail: () => Effect.die("unused"),
    getActivityMap: () => Effect.die("unused"),
    getActivityStreams: () => Effect.die("unused"),
    getAthleteProfile: () => Effect.die("unused"),
    listActivities: () => listActivities,
  });
}

function createProviderSessionLayer() {
  return Layer.succeed(ProviderSessionContext, {
    getActiveProviderSession: () =>
      Effect.succeed({
        apiKey: "api-key",
        authType: "basic" as const,
        connectionId: 456,
        provider: "intervals_icu" as const,
        providerUserId: "athlete-1",
      }),
    getActiveProviderSessionForUser: () => Effect.die("unused"),
  });
}

type FinishedSyncRun = {
  activitiesCreated: number;
  activitiesSeen: number;
  activitiesUpdated: number;
  errorCode?: string;
  errorMessage?: string;
  metadata?: unknown;
  status: "failed" | "partial" | "success";
  syncRunId: number;
};

type SyncRepositoryRecorder = {
  finishedRuns: FinishedSyncRun[];
  syncedConnections: Array<{ connectionId: number; syncedAt: Date }>;
};

function createSyncRepositoryRecorder(): SyncRepositoryRecorder {
  return {
    finishedRuns: [],
    syncedConnections: [],
  };
}

function createSyncRepositoryLayer(repository: SyncRepositoryRecorder) {
  return Layer.succeed(ActivitySyncRepository, {
    createActivitySyncRun: async () => ({ id: 123 }),
    finishActivitySyncRun: async (input) => {
      repository.finishedRuns.push(input);
    },
    getLatestIncrementalActivitySyncRunForUser: async () => null,
    getLatestSuccessfulActivitySyncRunForUser: async () => null,
    hasSuccessfulActivitySyncRunForUser: async () => false,
    markProviderConnectionSynced: async (input) => {
      repository.syncedConnections.push(input);
    },
  });
}
