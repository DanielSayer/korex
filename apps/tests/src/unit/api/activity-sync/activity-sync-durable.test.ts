import type { ActivitySyncModule } from "@korex/api/modules/activity-sync/activity-sync.service";
import type { SyncUserActivitiesInput } from "@korex/api/modules/activity-sync/activity-sync.types";
import {
  type ActivitySyncTaskRepository,
  createActivitySyncCommandModule,
  createActivitySyncTaskModule,
} from "@korex/api/modules/activity-sync/activity-sync-durable";
import { ActiveProviderConnectionNotFoundError } from "@korex/api/modules/provider-connections/provider-connections.errors";
import { describe, expect, it } from "vitest";

describe("durable Activity Sync", () => {
  it("queues identifiers without provider credentials", async () => {
    const payloads: unknown[] = [];
    const command = createActivitySyncCommandModule({
      now: () => new Date("2026-04-02T00:00:00.000Z"),
      repository: {
        enqueueActivitySyncRun: async (input) => {
          payloads.push({ syncRunId: 123, userId: input.userId });
          return { id: 123 };
        },
        getLatestIncrementalActivitySyncRunForUser: async () => null,
        getLatestSuccessfulActivitySyncRunForUser: async () => null,
        hasSuccessfulActivitySyncRunForUser: async () => false,
      },
    });

    await expect(command.enqueueInitialSync("user-1")).resolves.toEqual({
      status: "pending",
      syncRunId: 123,
    });
    expect(payloads).toEqual([{ syncRunId: 123, userId: "user-1" }]);
    expect(JSON.stringify(payloads)).not.toMatch(/apiKey|secret|credential/i);
  });

  it("claims concurrent duplicate deliveries only once", async () => {
    const repository = new FakeTaskRepository();
    let executions = 0;
    const task = createActivitySyncTaskModule({
      activitySync: createActivitySync(async () => {
        executions += 1;
      }),
      repository,
    });

    const results = await Promise.all([
      task.run({ syncRunId: 123, userId: "user-1" }),
      task.run({ syncRunId: 123, userId: "user-1" }),
    ]);

    expect(executions).toBe(1);
    expect(results.filter((result) => result.skipped)).toHaveLength(1);
  });

  it("resets retriable failures to pending and succeeds on retry", async () => {
    const repository = new FakeTaskRepository();
    let attempts = 0;
    const task = createActivitySyncTaskModule({
      activitySync: createActivitySync(async () => {
        attempts += 1;
        if (attempts === 1) {
          repository.status = "failed";
          throw new Error("temporary failure");
        }
      }),
      repository,
    });

    await expect(
      task.run({ syncRunId: 123, userId: "user-1" }),
    ).rejects.toThrow("temporary failure");
    expect(repository.status).toBe("pending");

    await expect(
      task.run({ syncRunId: 123, userId: "user-1" }),
    ).resolves.toMatchObject({ skipped: false });
    expect(attempts).toBe(2);
  });

  it("skips replay of terminal Sync Runs", async () => {
    const repository = new FakeTaskRepository();
    repository.status = "success";
    let executions = 0;
    const task = createActivitySyncTaskModule({
      activitySync: createActivitySync(async () => {
        executions += 1;
      }),
      repository,
    });

    await expect(
      task.run({ syncRunId: 123, userId: "user-1" }),
    ).resolves.toEqual({ skipped: true, status: "success", syncRunId: 123 });
    expect(executions).toBe(0);
  });

  it("resolves provider availability when queued work executes", async () => {
    const repository = new FakeTaskRepository();
    let connected = true;
    const task = createActivitySyncTaskModule({
      activitySync: createActivitySync(async () => {
        if (!connected) {
          throw new ActiveProviderConnectionNotFoundError({
            message: "Active provider connection not found",
          });
        }
      }),
      repository,
    });

    connected = false;
    await expect(
      task.run({ syncRunId: 123, userId: "user-1" }),
    ).resolves.toEqual({ skipped: false, status: "failed", syncRunId: 123 });
    expect(repository.status).toBe("failed");
  });

  it("propagates AbortSignal into Activity Sync execution", async () => {
    const repository = new FakeTaskRepository();
    const controller = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    const task = createActivitySyncTaskModule({
      activitySync: createActivitySync(async (input) => {
        receivedSignal = input.signal;
      }),
      repository,
    });

    await task.run({ syncRunId: 123, userId: "user-1" }, controller.signal);
    expect(receivedSignal).toBe(controller.signal);

    const aborted = new AbortController();
    aborted.abort();
    await expect(
      task.run({ syncRunId: 456, userId: "user-1" }, aborted.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});

function createActivitySync(
  execute: (input: SyncUserActivitiesInput) => Promise<void>,
): ActivitySyncModule {
  return {
    fetchIntervalsIcuActivities: async () => {
      throw new Error("unused");
    },
    syncUserActivities: async (input) => {
      await execute(input);
      return {
        activitiesCreated: 0,
        activitiesSeen: 0,
        activitiesStored: 0,
        activitiesUpdated: 0,
        errors: [],
        status: "success",
        syncRunId: input.syncRunId ?? 123,
      };
    },
  };
}

class FakeTaskRepository implements ActivitySyncTaskRepository {
  status: "pending" | "running" | "success" | "failed" | "partial" = "pending";

  claimActivitySyncRun = async (syncRunId: number) => {
    if (syncRunId !== 123 || this.status !== "pending") return false;
    this.status = "running";
    return true;
  };

  getActivitySyncRunForTask = async (syncRunId: number) => {
    if (syncRunId !== 123) return null;
    return {
      id: 123,
      startedAt: new Date("2026-04-02T00:00:00.000Z"),
      status: this.status,
      syncType: "initial" as const,
      userId: "user-1",
    };
  };

  getLatestSuccessfulActivitySyncRunForUser = async () => null;

  markActivitySyncRunExecutionFailed = async () => {
    this.status = "failed";
  };

  resetActivitySyncRunForRetry = async () => {
    if (this.status === "running" || this.status === "failed") {
      this.status = "pending";
    }
  };
}
