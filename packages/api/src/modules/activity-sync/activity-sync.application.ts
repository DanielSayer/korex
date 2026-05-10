import { IntervalsIcuClientLive } from "@korex/integrations/intervals-icu/live";
import { ORPCError } from "@orpc/server";
import { Cause, Effect, Exit, Layer, Option } from "effect";
import { ActivitySyncRepository } from "./activity-sync.dependencies";
import {
  ActivitySyncError,
  ActivitySyncProviderNotSupportedError,
  SuccessfulActivitySyncExistsError,
  SuccessfulActivitySyncNotFoundError,
} from "./activity-sync.errors";
import { ActivitySyncLive } from "./activity-sync.live";
import { syncUserActivities } from "./activity-sync.service";

export function executeInitialSync(userId: string) {
  return runActivitySyncEffect(
    Effect.gen(function* () {
      const now = new Date();
      const repository = yield* ActivitySyncRepository;
      const hasSuccessfulSync = yield* Effect.promise(() =>
        repository.hasSuccessfulActivitySyncRunForUser(userId),
      );

      if (hasSuccessfulSync) {
        return yield* Effect.fail(
          new SuccessfulActivitySyncExistsError({
            message: "User already has a successful sync",
          }),
        );
      }

      return yield* syncUserActivities({
        endDate: now,
        startDate: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
        syncType: "initial",
        userId,
      });
    }).pipe(
      Effect.provide(Layer.mergeAll(IntervalsIcuClientLive, ActivitySyncLive)),
    ),
  );
}

export function executeIncrementalSync(userId: string) {
  return runActivitySyncEffect(
    Effect.gen(function* () {
      const now = new Date();
      const repository = yield* ActivitySyncRepository;
      const latestSuccessfulSync = yield* Effect.promise(() =>
        repository.getLatestSuccessfulActivitySyncRunForUser(userId),
      );

      if (!latestSuccessfulSync) {
        return yield* Effect.fail(
          new SuccessfulActivitySyncNotFoundError({
            message: "User does not have a successful sync",
          }),
        );
      }

      return yield* syncUserActivities({
        endDate: now,
        startDate: latestSuccessfulSync.startedAt,
        syncType: "incremental",
        userId,
      });
    }).pipe(
      Effect.provide(Layer.mergeAll(IntervalsIcuClientLive, ActivitySyncLive)),
    ),
  );
}

async function runActivitySyncEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Promise<A> {
  const exit = await Effect.runPromiseExit(
    effect as Effect.Effect<A, E, never>,
  );

  if (Exit.isSuccess(exit)) {
    return exit.value;
  }

  const failure = Option.getOrUndefined(Cause.failureOption(exit.cause));

  throw toActivitySyncOrpcError(failure ?? exit.cause);
}

function toActivitySyncOrpcError(cause: unknown) {
  if (cause instanceof ORPCError) {
    return cause;
  }

  if (cause instanceof SuccessfulActivitySyncExistsError) {
    return new ORPCError("CONFLICT", {
      message: "User already has a successful sync",
      cause,
    });
  }

  if (cause instanceof SuccessfulActivitySyncNotFoundError) {
    return new ORPCError("CONFLICT", {
      message: "User does not have a successful sync",
      cause,
    });
  }

  if (cause instanceof ActivitySyncError) {
    return new ORPCError("BAD_GATEWAY", {
      message: cause.message,
      cause,
    });
  }

  if (cause instanceof ActivitySyncProviderNotSupportedError) {
    return new ORPCError("BAD_REQUEST", {
      message: "Activity sync provider is not supported",
      cause,
    });
  }

  return new ORPCError("INTERNAL_SERVER_ERROR", {
    message: "Failed to sync activities",
    cause,
  });
}
