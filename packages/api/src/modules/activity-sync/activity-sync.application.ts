import { ORPCError } from "@orpc/server";
import {
  ActivitySyncError,
  ActivitySyncProviderNotSupportedError,
  IncrementalActivitySyncRateLimitedError,
  SuccessfulActivitySyncExistsError,
  SuccessfulActivitySyncNotFoundError,
} from "./activity-sync.errors";
import type { createActivitySyncCommandModule } from "./activity-sync-durable";

export function createDurableActivitySyncApplication(
  command: ReturnType<typeof createActivitySyncCommandModule>,
) {
  return {
    executeIncrementalSync: (userId: string) =>
      runActivitySyncOperation(() => command.enqueueIncrementalSync(userId)),
    executeInitialSync: (userId: string) =>
      runActivitySyncOperation(() => command.enqueueInitialSync(userId)),
  };
}

async function runActivitySyncOperation<A>(operation: () => Promise<A>) {
  try {
    return await operation();
  } catch (cause) {
    throw toActivitySyncOrpcError(cause);
  }
}

function toActivitySyncOrpcError(cause: unknown) {
  if (cause instanceof ORPCError) return cause;
  if (cause instanceof SuccessfulActivitySyncExistsError) {
    return new ORPCError("CONFLICT", {
      cause,
      message: "User already has a successful sync",
    });
  }
  if (cause instanceof SuccessfulActivitySyncNotFoundError) {
    return new ORPCError("CONFLICT", {
      cause,
      message: "User does not have a successful sync",
    });
  }
  if (cause instanceof IncrementalActivitySyncRateLimitedError) {
    return new ORPCError("TOO_MANY_REQUESTS", {
      cause,
      message: cause.message,
    });
  }
  if (cause instanceof ActivitySyncError) {
    return new ORPCError("BAD_GATEWAY", { cause, message: cause.message });
  }
  if (cause instanceof ActivitySyncProviderNotSupportedError) {
    return new ORPCError("BAD_REQUEST", {
      cause,
      message: "Activity sync provider is not supported",
    });
  }
  return new ORPCError("INTERNAL_SERVER_ERROR", {
    cause,
    message: "Failed to sync activities",
  });
}
