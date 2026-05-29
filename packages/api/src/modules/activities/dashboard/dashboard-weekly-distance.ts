import type {
  DashboardWeeklyDistance,
  DashboardWeeklyDistanceBucket,
} from "../activities.types";
import {
  getPreviousTrainingWeekStartAt,
  getTrainingWeekStartAt,
  millisecondsPerTrainingWeek,
} from "../weekly-training-summaries/training-week";

export const dashboardWeeklyDistanceBucketCount = 12;

export type DashboardWeeklyDistanceRow = {
  activityCount: number;
  bucketStartAt: Date | string;
  distanceMeters: number;
};

export function createDashboardWeeklyDistanceBuckets({
  bucketCount = dashboardWeeklyDistanceBucketCount,
  now = new Date(),
}: {
  bucketCount?: number;
  now?: Date;
} = {}): DashboardWeeklyDistanceBucket[] {
  const currentWeekStartAt = getTrainingWeekStartAt(now);
  const firstBucketStartAt = new Date(
    currentWeekStartAt.getTime() -
      (bucketCount - 1) * millisecondsPerTrainingWeek,
  );

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStartAt = new Date(
      firstBucketStartAt.getTime() + index * millisecondsPerTrainingWeek,
    );

    return {
      activityCount: 0,
      bucketEndAt: new Date(
        bucketStartAt.getTime() + millisecondsPerTrainingWeek,
      ),
      bucketStartAt,
      distanceMeters: 0,
    };
  });
}

export function buildDashboardWeeklyDistance({
  lastWeekAtSamePointDistanceMeters,
  now = new Date(),
  rows,
}: {
  lastWeekAtSamePointDistanceMeters: number;
  now?: Date;
  rows: DashboardWeeklyDistanceRow[];
}): DashboardWeeklyDistance {
  const buckets = createDashboardWeeklyDistanceBuckets({ now });
  const rowsByBucket = new Map(
    rows.map((row) => [toUtcDate(row.bucketStartAt).toISOString(), row]),
  );
  const weeklyDistanceBuckets = buckets.map((bucket) => {
    const row = rowsByBucket.get(bucket.bucketStartAt.toISOString());

    return {
      ...bucket,
      activityCount: row?.activityCount ?? 0,
      distanceMeters: row?.distanceMeters ?? 0,
    };
  });
  const thisWeekBucket = weeklyDistanceBuckets.at(-1);
  const thisWeekDistanceMeters = thisWeekBucket?.distanceMeters ?? 0;
  const totalDistanceMeters = weeklyDistanceBuckets.reduce(
    (sum, bucket) => sum + bucket.distanceMeters,
    0,
  );
  const weekStartAt = getTrainingWeekStartAt(now);

  return {
    averageWeeklyDistanceMeters:
      weeklyDistanceBuckets.length === 0
        ? 0
        : totalDistanceMeters / weeklyDistanceBuckets.length,
    distanceDeltaMeters:
      thisWeekDistanceMeters - lastWeekAtSamePointDistanceMeters,
    lastWeekAtSamePointDistanceMeters,
    thisWeekDistanceMeters,
    weekEndAt: new Date(weekStartAt.getTime() + millisecondsPerTrainingWeek),
    weekStartAt,
    weeklyDistanceBuckets,
  };
}

export function getLastWeekSamePointRange(now = new Date()) {
  const currentWeekStartAt = getTrainingWeekStartAt(now);
  const previousWeekStartAt = getPreviousTrainingWeekStartAt(currentWeekStartAt);
  const elapsedInCurrentWeekMilliseconds =
    now.getTime() - currentWeekStartAt.getTime();

  return {
    endAt: new Date(
      previousWeekStartAt.getTime() + elapsedInCurrentWeekMilliseconds,
    ),
    startAt: previousWeekStartAt,
  };
}

function toUtcDate(value: Date | string) {
  if (value instanceof Date) {
    return value;
  }

  return new Date(`${value.replace(" ", "T")}Z`);
}
