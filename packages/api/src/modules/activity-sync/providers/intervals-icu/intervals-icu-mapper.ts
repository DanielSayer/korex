import type { IntervalsIcuActivityDetail } from "@korex/integrations/intervals-icu/client";
import { ActivitySyncError } from "../../activity-sync.errors";
import type { UpsertExternalActivityInput } from "../../repositories/external-activities.repository";

export function toExternalActivityUpsertInput({
  detail,
  lastSyncRunId,
  providerAthleteId,
  userId,
}: {
  detail: IntervalsIcuActivityDetail;
  lastSyncRunId: number;
  providerAthleteId: string;
  userId: string;
}): UpsertExternalActivityInput {
  return {
    activityEndAt: readOptionalDate(detail.end_date_local ?? detail.end_date),
    activityStartAt: readRequiredDate(
      detail.start_date_local ?? detail.start_date ?? detail.start_time,
      "activity start date",
    ),
    lastSyncRunId,
    provider: "intervals_icu",
    providerActivityId: String(detail.id),
    providerAthleteId,
    providerUpdatedAt: readOptionalDate(detail.updated_at ?? detail.updated),
    rawData: detail,
    sourceType: detail.source ?? null,
    sportType: detail.type ?? detail.sport ?? detail.category ?? null,
    userId,
  };
}

function readRequiredDate(value: unknown, fieldName: string) {
  const date = readOptionalDate(value);

  if (!date) {
    throw new ActivitySyncError({
      message: `Intervals.icu ${fieldName} is missing or invalid`,
    });
  }

  return date;
}

function readOptionalDate(value: unknown) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value as string);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}
