import type {
  AnalyticsVolume,
  AnalyticsVolumeBucket,
  AnalyticsVolumeBucketMode,
} from "../activities.types";
import { getTrainingWeekStartAt } from "../weekly-training-summaries/training-week";
import {
  getBrisbaneCalendarDateStartAt,
  toUtcDate,
} from "./analytics-calendar";

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export type AnalyticsVolumeRow = {
  activityCount: number;
  bucketStartAt: Date | string;
  distanceMeters: number;
  durationSeconds: number;
};

export function buildAnalyticsVolume({
  bucketMode,
  buckets,
  rows,
  year,
}: {
  bucketMode: AnalyticsVolumeBucketMode;
  buckets: AnalyticsVolumeBucket[];
  rows: AnalyticsVolumeRow[];
  year: number;
}): AnalyticsVolume {
  const rowsByBucket = new Map(
    rows.map((row) => [toUtcDate(row.bucketStartAt).toISOString(), row]),
  );
  let cumulativeDistanceMeters = 0;
  let totalActivityCount = 0;
  let totalDurationSeconds = 0;

  const filledBuckets = buckets.map((bucket) => {
    const row = rowsByBucket.get(bucket.bucketStartAt.toISOString());
    const distanceMeters = row?.distanceMeters ?? 0;
    const durationSeconds = row?.durationSeconds ?? 0;
    const activityCount = row?.activityCount ?? 0;

    cumulativeDistanceMeters += distanceMeters;
    totalActivityCount += activityCount;
    totalDurationSeconds += durationSeconds;

    return {
      ...bucket,
      activityCount,
      cumulativeDistanceMeters,
      distanceMeters,
      durationSeconds,
    };
  });

  return {
    bucketMode,
    buckets: filledBuckets,
    monthlyBuckets: [],
    totalActivityCount,
    totalDistanceMeters: cumulativeDistanceMeters,
    totalDurationSeconds,
    weeklyBuckets: [],
    year,
  };
}

export function createMonthlyAnalyticsVolumeBuckets(
  year: number,
): AnalyticsVolumeBucket[] {
  return Array.from({ length: 12 }, (_, month) => {
    const bucketStartAt = getBrisbaneCalendarDateStartAt(year, month, 1);
    const bucketEndAt = getBrisbaneCalendarDateStartAt(year, month + 1, 1);

    return createEmptyBucket({ bucketEndAt, bucketStartAt });
  });
}

export function createWeeklyAnalyticsVolumeBuckets(
  year: number,
): AnalyticsVolumeBucket[] {
  const yearStartAt = getBrisbaneCalendarDateStartAt(year, 0, 1);
  const nextYearStartAt = getBrisbaneCalendarDateStartAt(year + 1, 0, 1);
  let bucketStartAt = getTrainingWeekStartAt(yearStartAt);

  if (bucketStartAt < yearStartAt) {
    bucketStartAt = new Date(bucketStartAt.getTime() + 7 * millisecondsPerDay);
  }

  const buckets: AnalyticsVolumeBucket[] = [];

  while (bucketStartAt < nextYearStartAt) {
    const bucketEndAt = new Date(
      bucketStartAt.getTime() + 7 * millisecondsPerDay,
    );

    buckets.push(createEmptyBucket({ bucketEndAt, bucketStartAt }));
    bucketStartAt = bucketEndAt;
  }

  return buckets;
}

function createEmptyBucket({
  bucketEndAt,
  bucketStartAt,
}: {
  bucketEndAt: Date;
  bucketStartAt: Date;
}): AnalyticsVolumeBucket {
  return {
    activityCount: 0,
    bucketEndAt,
    bucketStartAt,
    cumulativeDistanceMeters: 0,
    distanceMeters: 0,
    durationSeconds: 0,
  };
}
