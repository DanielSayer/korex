import { db } from "@korex/db";
import type { IntervalsIcuActivityDetail } from "@korex/integrations/intervals-icu/client";
import { Effect } from "effect";
import {
  deleteActivity,
  replaceActivityLaps,
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
import { toActivityLapsFromIntervalsIcuDetail } from "./intervals-icu-activity-lap.acl";
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
            await db.transaction(async (tx) => {
              await clearExternalActivityActivityLink(
                upsertedExternalActivity.externalActivityId,
                tx,
              );
              await deleteActivity(existingActivityId, tx);
            });
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

    const activityLaps = readActivityLapAclResult({ detail, errors });

    if (!activityLaps) {
      return {
        externalActivityId: upsertedExternalActivity.externalActivityId,
        skipped: true,
      } satisfies StoreIntervalsIcuActivityImportResult;
    }

    const activityUpsert = yield* Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          const upsertedActivity = await upsertActivity({
            activityId: upsertedExternalActivity.activityId,
            database: tx,
            input: activityResult.activity,
          });

          await replaceActivityLaps({
            activityId: upsertedActivity.activityId,
            database: tx,
            laps: activityLaps,
          });

          await linkExternalActivityToActivity({
            activityId: upsertedActivity.activityId,
            database: tx,
            externalActivityId: upsertedExternalActivity.externalActivityId,
          });

          return upsertedActivity;
        }),
      catch: (cause) =>
        new ActivitySyncError({
          cause,
          message: "Failed to store activity",
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

function readActivityLapAclResult({
  detail,
  errors,
}: {
  detail: IntervalsIcuActivityDetail;
  errors: ActivitySyncFailure[];
}) {
  try {
    return toActivityLapsFromIntervalsIcuDetail(detail);
  } catch (error) {
    errors.push({
      activityId: String(detail.id),
      message:
        error instanceof Error
          ? error.message
          : "Failed to translate activity laps",
      stage: "detail",
    });
    return null;
  }
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
