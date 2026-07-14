import type { IntervalsIcuActivityDetail } from "@korex/integrations/intervals-icu/client";
import type { ActivityImportWriterService } from "../../activity-sync.dependencies";
import { ActivitySyncError } from "../../activity-sync.errors";
import type { ActivitySyncFailure } from "../../activity-sync.types";
import { toActivityFromIntervalsIcuDetail } from "./intervals-icu-activity.acl";
import { toActivityLapsFromIntervalsIcuDetail } from "./intervals-icu-activity-lap.acl";
import { toExternalActivityUpsertInput } from "./intervals-icu-mapper";

export type StoreIntervalsIcuActivityImportResult =
  | {
      activityId: number;
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

export async function storeIntervalsIcuActivityImport({
  detail,
  errors,
  lastSyncRunId,
  providerAthleteId,
  writer,
  userId,
}: {
  detail: IntervalsIcuActivityDetail;
  errors: ActivitySyncFailure[];
  lastSyncRunId: number;
  providerAthleteId: string;
  writer: ActivityImportWriterService;
  userId: string;
}) {
  let upsertedExternalActivity: Awaited<
    ReturnType<ActivityImportWriterService["storeExternalActivity"]>
  >;
  try {
    upsertedExternalActivity = await writer.storeExternalActivity(
      toExternalActivityUpsertInput({
        detail,
        lastSyncRunId,
        providerAthleteId,
        userId,
      }),
    );
  } catch (cause) {
    throw new ActivitySyncError({
      cause,
      message: "Failed to store external activity",
    });
  }

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
      try {
        await writer.unlinkUnsupportedActivity({
          activityId: existingActivityId,
          externalActivityId: upsertedExternalActivity.externalActivityId,
        });
      } catch (cause) {
        throw new ActivitySyncError({
          cause,
          message: "Failed to unlink unsupported activity",
        });
      }
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

  let activityUpsert: Awaited<
    ReturnType<ActivityImportWriterService["storeCoreActivity"]>
  >;
  try {
    activityUpsert = await writer.storeCoreActivity({
      activity: activityResult.activity,
      activityId: upsertedExternalActivity.activityId,
      externalActivityId: upsertedExternalActivity.externalActivityId,
      laps: activityLaps,
    });
  } catch (cause) {
    throw new ActivitySyncError({
      cause,
      message: "Failed to store activity",
    });
  }

  return {
    activityId: activityUpsert.activityId,
    created: activityUpsert.created,
    externalActivityId: upsertedExternalActivity.externalActivityId,
    providerActivityId: String(detail.id),
    skipped: false,
    updated: !activityUpsert.created && upsertedExternalActivity.updated,
  } satisfies StoreIntervalsIcuActivityImportResult;
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
