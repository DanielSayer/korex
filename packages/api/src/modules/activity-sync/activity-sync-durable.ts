import type { JobHandler } from "../job-runtime/job-runtime";
import { ActiveProviderConnectionNotFoundError } from "../provider-connections/provider-connections.errors";
import {
  IncrementalActivitySyncRateLimitedError,
  SuccessfulActivitySyncExistsError,
  SuccessfulActivitySyncNotFoundError,
} from "./activity-sync.errors";
import type { ActivitySyncModule } from "./activity-sync.service";

const INCREMENTAL_SYNC_RATE_LIMIT_MS = 5 * 60 * 1000;

export type ActivitySyncJobPayload = {
  syncRunId: number;
  userId: string;
};

export type ActivitySyncCommandRepository = {
  enqueueActivitySyncRun: (input: {
    provider: "intervals_icu";
    syncType: "initial" | "incremental";
    userId: string;
  }) => Promise<{ id: number }>;
  getLatestIncrementalActivitySyncRunForUser: (
    userId: string,
  ) => Promise<{ id: number; startedAt: Date } | null>;
  getLatestSuccessfulActivitySyncRunForUser: (
    userId: string,
  ) => Promise<{ id: number; startedAt: Date } | null>;
  hasSuccessfulActivitySyncRunForUser: (userId: string) => Promise<boolean>;
};

export function createActivitySyncCommandModule({
  now,
  repository,
}: {
  now: () => Date;
  repository: ActivitySyncCommandRepository;
}) {
  const enqueue = async (
    syncType: "initial" | "incremental",
    userId: string,
  ) => {
    const syncRun = await repository.enqueueActivitySyncRun({
      provider: "intervals_icu",
      syncType,
      userId,
    });
    return { status: "pending" as const, syncRunId: syncRun.id };
  };

  return {
    enqueueInitialSync: async (userId: string) => {
      if (await repository.hasSuccessfulActivitySyncRunForUser(userId)) {
        throw new SuccessfulActivitySyncExistsError({
          message: "User already has a successful sync",
        });
      }
      return enqueue("initial", userId);
    },
    enqueueIncrementalSync: async (userId: string) => {
      const [latestSuccessfulSync, latestIncrementalSync] = await Promise.all([
        repository.getLatestSuccessfulActivitySyncRunForUser(userId),
        repository.getLatestIncrementalActivitySyncRunForUser(userId),
      ]);
      if (!latestSuccessfulSync) {
        throw new SuccessfulActivitySyncNotFoundError({
          message: "User does not have a successful sync",
        });
      }
      if (
        latestIncrementalSync &&
        latestIncrementalSync.startedAt.getTime() +
          INCREMENTAL_SYNC_RATE_LIMIT_MS >
          now().getTime()
      ) {
        throw new IncrementalActivitySyncRateLimitedError({
          message: "Incremental activity sync is rate limited",
        });
      }
      return enqueue("incremental", userId);
    },
  };
}

export const activitySyncJobName = "activity.sync";

export function createActivitySyncJobModule(
  task: ReturnType<typeof createActivitySyncTaskModule>,
) {
  return {
    handler: async (
      payload: Record<string, unknown>,
      context: Parameters<JobHandler>[1],
    ) => {
      await task.run(requiredActivitySyncPayload(payload), context.signal);
    },
    name: activitySyncJobName,
  };
}

export type ActivitySyncTaskRepository = {
  claimActivitySyncRun: (syncRunId: number) => Promise<boolean>;
  getActivitySyncRunForTask: (syncRunId: number) => Promise<{
    id: number;
    startedAt: Date;
    status: "pending" | "running" | "success" | "failed" | "partial";
    syncType: "initial" | "incremental";
    userId: string;
  } | null>;
  getLatestSuccessfulActivitySyncRunForUser: (
    userId: string,
  ) => Promise<{ id: number; startedAt: Date } | null>;
  markActivitySyncRunExecutionFailed: (input: {
    message: string;
    syncRunId: number;
  }) => Promise<void>;
  resetActivitySyncRunForRetry: (syncRunId: number) => Promise<void>;
};

export function createActivitySyncTaskModule({
  activitySync,
  repository,
}: {
  activitySync: ActivitySyncModule;
  repository: ActivitySyncTaskRepository;
}) {
  return {
    run: async (
      { syncRunId, userId }: ActivitySyncJobPayload,
      signal?: AbortSignal,
    ) => {
      signal?.throwIfAborted();
      const claimed = await repository.claimActivitySyncRun(syncRunId);
      const syncRun = await repository.getActivitySyncRunForTask(syncRunId);

      if (!syncRun || syncRun.userId !== userId) {
        throw new Error("Activity Sync Run does not match queued work");
      }
      if (!claimed) {
        return { skipped: true as const, status: syncRun.status, syncRunId };
      }

      const endDate = syncRun.startedAt;
      let startDate: Date;
      if (syncRun.syncType === "initial") {
        startDate = new Date(Date.UTC(endDate.getUTCFullYear(), 0, 1));
      } else {
        const latestSuccessfulSync =
          await repository.getLatestSuccessfulActivitySyncRunForUser(userId);
        if (!latestSuccessfulSync) {
          await repository.resetActivitySyncRunForRetry(syncRunId);
          throw new SuccessfulActivitySyncNotFoundError({
            message: "User does not have a successful sync",
          });
        }
        startDate = latestSuccessfulSync.startedAt;
      }

      try {
        const result = await activitySync.syncUserActivities({
          endDate,
          signal,
          startDate,
          syncRunId,
          syncType: syncRun.syncType,
          userId,
        });
        return { ...result, skipped: false as const };
      } catch (cause) {
        if (cause instanceof ActiveProviderConnectionNotFoundError) {
          await repository.markActivitySyncRunExecutionFailed({
            message: cause.message,
            syncRunId,
          });
          return {
            skipped: false as const,
            status: "failed" as const,
            syncRunId,
          };
        }
        await repository.resetActivitySyncRunForRetry(syncRunId);
        throw cause;
      }
    },
  };
}

function requiredActivitySyncPayload(
  payload: Record<string, unknown>,
): ActivitySyncJobPayload {
  const { syncRunId, userId } = payload;

  if (!Number.isInteger(syncRunId) || typeof userId !== "string") {
    throw new Error("Activity Sync job requires syncRunId and userId");
  }

  return { syncRunId: syncRunId as number, userId };
}
