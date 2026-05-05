import type { IntervalsIcuActivityDetail } from "@korex/integrations/intervals-icu/client";
import { Effect } from "effect";
import {
  deleteActivity,
  upsertActivity,
} from "../../../activities/activities.repository";
import { ActivitySyncError } from "../../activity-sync.errors";
import type { ActivitySyncFailure } from "../../activity-sync.types";
import {
  clearExternalActivityActivityLink,
  linkExternalActivityToActivity,
  upsertExternalActivity,
} from "../../repositories/external-activities.repository";
import { toActivityFromIntervalsIcuDetail } from "./intervals-icu-activity.acl";
import { toExternalActivityUpsertInput } from "./intervals-icu-mapper";

export type StoreIntervalsIcuActivityImportResult =
  | {
      created: boolean;
      externalActivityId: number;
      providerActivityId: string;
      skipped: false;
      updated: boolean;
    }
  | {
      externalActivityId: number;
      skipped: true;
    };

export function storeIntervalsIcuActivityImport({
  detail,
  errors,
  lastSyncRunId,
  providerAthleteId,
  userId,
}: {
  detail: IntervalsIcuActivityDetail;
  errors: ActivitySyncFailure[];
  lastSyncRunId: number;
  providerAthleteId: string;
  userId: string;
}) {
  return Effect.gen(function* () {
    const upsertedExternalActivity = yield* Effect.tryPromise({
      try: () =>
        upsertExternalActivity(
          toExternalActivityUpsertInput({
            detail,
            lastSyncRunId,
            providerAthleteId,
            userId,
          }),
        ),
      catch: (cause) =>
        new ActivitySyncError({
          cause,
          message: "Failed to store external activity",
        }),
    });

    const activityResult = readActivityAclResult({
      detail,
      errors,
      userId,
    });

    if (!activityResult) {
      return {
        externalActivityId: upsertedExternalActivity.externalActivityId,
        skipped: true,
      } satisfies StoreIntervalsIcuActivityImportResult;
    }

    if (activityResult.type === "unsupported_sport_type") {
      const existingActivityId = upsertedExternalActivity.activityId;

      if (existingActivityId) {
        yield* Effect.tryPromise({
          try: async () => {
            await clearExternalActivityActivityLink(
              upsertedExternalActivity.externalActivityId,
            );
            await deleteActivity(existingActivityId);
          },
          catch: (cause) =>
            new ActivitySyncError({
              cause,
              message: "Failed to unlink unsupported activity",
            }),
        });
      }

      return {
        externalActivityId: upsertedExternalActivity.externalActivityId,
        skipped: true,
      } satisfies StoreIntervalsIcuActivityImportResult;
    }

    const activityUpsert = yield* Effect.tryPromise({
      try: () =>
        upsertActivity({
          activityId: upsertedExternalActivity.activityId,
          input: activityResult.activity,
        }),
      catch: (cause) =>
        new ActivitySyncError({
          cause,
          message: "Failed to store activity",
        }),
    });

    yield* Effect.tryPromise({
      try: () =>
        linkExternalActivityToActivity({
          activityId: activityUpsert.activityId,
          externalActivityId: upsertedExternalActivity.externalActivityId,
        }),
      catch: (cause) =>
        new ActivitySyncError({
          cause,
          message: "Failed to link external activity",
        }),
    });

    return {
      created: activityUpsert.created,
      externalActivityId: upsertedExternalActivity.externalActivityId,
      providerActivityId: String(detail.id),
      skipped: false,
      updated: !activityUpsert.created && upsertedExternalActivity.updated,
    } satisfies StoreIntervalsIcuActivityImportResult;
  });
}

function readActivityAclResult({
  detail,
  errors,
  userId,
}: {
  detail: IntervalsIcuActivityDetail;
  errors: ActivitySyncFailure[];
  userId: string;
}) {
  try {
    return toActivityFromIntervalsIcuDetail({ detail, userId });
  } catch (error) {
    errors.push({
      activityId: String(detail.id),
      message:
        error instanceof Error ? error.message : "Failed to translate activity",
      stage: "detail",
    });
    return null;
  }
}
