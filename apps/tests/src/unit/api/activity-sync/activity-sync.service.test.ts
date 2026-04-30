import {
  ActivitySyncRepository,
  type ActivitySyncRepositoryService,
  IntervalsIcuActivitySync,
  type IntervalsIcuActivitySyncService,
} from "@korex/api/modules/activity-sync/activity-sync.dependencies";
import { fetchIntervalsIcuActivities } from "@korex/api/modules/activity-sync/activity-sync.service";
import {
  ProviderSessionContext,
  type ProviderSessionService,
} from "@korex/api/modules/provider-connections/provider-session";
import type { IntervalsIcuClientService } from "@korex/integrations/intervals-icu/client";
import {
  IntervalsIcuClient,
  IntervalsIcuClientError,
} from "@korex/integrations/intervals-icu/client";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

const syncInput = {
  endDate: new Date("2026-04-02T00:00:00.000Z"),
  startDate: new Date("2026-04-01T00:00:00.000Z"),
  userId: "user-1",
};

let client: IntervalsIcuClientService;
let createActivitySyncRun: ReturnType<
  typeof vi.fn<ActivitySyncRepositoryService["createActivitySyncRun"]>
>;
let finishActivitySyncRun: ReturnType<
  typeof vi.fn<ActivitySyncRepositoryService["finishActivitySyncRun"]>
>;
let getActiveProviderSession: ReturnType<
  typeof vi.fn<ProviderSessionService["getActiveProviderSession"]>
>;
let layer: Layer.Layer<
  | ActivitySyncRepository
  | ProviderSessionContext
  | IntervalsIcuClient
  | IntervalsIcuActivitySync
>;
let listActivities: ReturnType<
  typeof vi.fn<IntervalsIcuClientService["listActivities"]>
>;
let syncIntervalsIcuActivity: ReturnType<
  typeof vi.fn<IntervalsIcuActivitySyncService["syncActivity"]>
>;

describe("activity sync service", () => {
  beforeEach(() => {
    listActivities = vi.fn(() =>
      Effect.succeed([{ id: "activity-1" }, { id: "activity-2" }]),
    );
    client = {
      getActivityDetail: vi.fn(),
      getActivityMap: vi.fn(),
      getActivityStreams: vi.fn(),
      getAthleteProfile: vi.fn(),
      listActivities,
    } as unknown as IntervalsIcuClientService;
    createActivitySyncRun = vi.fn(async () => ({ id: 100 }));
    finishActivitySyncRun = vi.fn(async () => undefined);
    getActiveProviderSession = vi.fn(() =>
      Effect.succeed({
        apiKey: "decrypted-api-key",
        authType: "basic" as const,
        provider: "intervals_icu" as const,
        providerUserId: "athlete-1",
      }),
    );
    syncIntervalsIcuActivity = vi.fn((input) =>
      Effect.sync(() => {
        input.counters.activitiesCreated += 1;
        input.counters.activitiesStored += 1;
      }),
    );

    layer = Layer.mergeAll(
      Layer.succeed(ActivitySyncRepository, {
        createActivitySyncRun,
        finishActivitySyncRun,
      }),
      Layer.succeed(ProviderSessionContext, {
        getActiveProviderSession,
      }),
      Layer.succeed(IntervalsIcuClient, client),
      Layer.succeed(IntervalsIcuActivitySync, {
        syncActivity: syncIntervalsIcuActivity,
      }),
    );
  });

  it("fetches the activity list and finishes a successful sync run", async () => {
    const result = await Effect.runPromise(
      fetchIntervalsIcuActivities(syncInput).pipe(Effect.provide(layer)),
    );

    expect(getActiveProviderSession).toHaveBeenCalledWith({
      provider: "intervals_icu",
      userId: "user-1",
    });
    expect(listActivities).toHaveBeenCalledWith({
      apiKey: "decrypted-api-key",
      athleteId: "athlete-1",
      endDate: syncInput.endDate,
      startDate: syncInput.startDate,
    });
    expect(syncIntervalsIcuActivity).toHaveBeenCalledTimes(2);
    expect(finishActivitySyncRun).toHaveBeenCalledWith({
      activitiesCreated: 2,
      activitiesSeen: 2,
      activitiesUpdated: 0,
      errorCode: undefined,
      errorMessage: undefined,
      metadata: { errors: [] },
      status: "success",
      syncRunId: 100,
    });
    expect(result).toEqual({
      activitiesCreated: 2,
      activitiesSeen: 2,
      activitiesStored: 2,
      activitiesUpdated: 0,
      errors: [],
      status: "success",
      syncRunId: 100,
    });
  });

  it("marks the run partial when an activity sync records an error", async () => {
    syncIntervalsIcuActivity.mockImplementation((input) =>
      Effect.sync(() => {
        if (input.activityId === "activity-1") {
          input.counters.activitiesCreated += 1;
          input.counters.activitiesStored += 1;
          return;
        }

        input.errors.push({
          activityId: input.activityId,
          message: "detail failed",
          stage: "detail",
        });
      }),
    );

    const result = await Effect.runPromise(
      fetchIntervalsIcuActivities(syncInput).pipe(Effect.provide(layer)),
    );

    expect(finishActivitySyncRun).toHaveBeenCalledWith({
      activitiesCreated: 1,
      activitiesSeen: 2,
      activitiesUpdated: 0,
      errorCode: "detail",
      errorMessage: "detail failed",
      metadata: {
        errors: [
          {
            activityId: "activity-2",
            message: "detail failed",
            stage: "detail",
          },
        ],
      },
      status: "partial",
      syncRunId: 100,
    });
    expect(result.status).toBe("partial");
    expect(result.activitiesStored).toBe(1);
  });

  it("marks the run failed when listing activities fails", async () => {
    listActivities.mockImplementation(() =>
      Effect.fail(
        new IntervalsIcuClientError({
          message: "list failed",
        }),
      ),
    );

    const result = await Effect.runPromiseExit(
      fetchIntervalsIcuActivities(syncInput).pipe(Effect.provide(layer)),
    );

    expect(result._tag).toBe("Failure");
    expect(syncIntervalsIcuActivity).not.toHaveBeenCalled();
    expect(finishActivitySyncRun).toHaveBeenCalledWith({
      activitiesCreated: 0,
      activitiesSeen: 0,
      activitiesUpdated: 0,
      errorCode: "list",
      errorMessage: "list failed",
      metadata: {
        errors: [
          {
            message: "list failed",
            stage: "list",
          },
        ],
      },
      status: "failed",
      syncRunId: 100,
    });
  });
});
