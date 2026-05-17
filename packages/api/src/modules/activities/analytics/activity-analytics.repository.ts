import { activities, db } from "@korex/db";
import { and, asc, eq, gte, inArray, lt, sql } from "drizzle-orm";

import type {
  AnalyticsVolume,
  AnalyticsVolumeBucket,
  AnalyticsVolumeBucketMode,
} from "../activities.types";
import { getTrainingWeekStartAt } from "../weekly-training-summaries/training-week";

const brisbaneUtcOffsetHours = 10;
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const millisecondsPerHour = 60 * 60 * 1000;

type AnalyticsVolumeRow = {
  activityCount: number;
  bucketStartAt: Date | string;
  distanceMeters: number;
};

export async function getAnalyticsVolume({
  bucketMode,
  userId,
  year,
}: {
  bucketMode: AnalyticsVolumeBucketMode;
  userId: string;
  year: number;
}): Promise<AnalyticsVolume> {
  const buckets =
    bucketMode === "monthly"
      ? createMonthlyBuckets(year)
      : createWeeklyBuckets(year);
  const firstBucket = buckets.at(0);
  const lastBucket = buckets.at(-1);

  if (!(firstBucket && lastBucket)) {
    return {
      bucketMode,
      buckets: [],
      totalActivityCount: 0,
      totalDistanceMeters: 0,
      year,
    };
  }

  const bucketExpression =
    bucketMode === "monthly"
      ? sql<Date>`date_trunc('month', ${activities.startAt} + interval '10 hours') - interval '10 hours'`
      : sql<Date>`date_trunc('week', ${activities.startAt} + interval '10 hours') - interval '10 hours'`;

  const rows = await db
    .select({
      activityCount: sql<number>`count(*)::int`,
      bucketStartAt: bucketExpression,
      distanceMeters: sql<number>`coalesce(sum(${activities.distanceMeters}), 0)::float`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        inArray(activities.sportType, ["run", "treadmill"]),
        gte(activities.startAt, firstBucket.bucketStartAt),
        lt(activities.startAt, lastBucket.bucketEndAt),
      ),
    )
    .groupBy(bucketExpression)
    .orderBy(asc(bucketExpression));

  return buildAnalyticsVolume({
    bucketMode,
    buckets,
    rows,
    year,
  });
}

function buildAnalyticsVolume({
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
    rows.map((row) => [toDate(row.bucketStartAt).toISOString(), row]),
  );
  let cumulativeDistanceMeters = 0;
  let totalActivityCount = 0;

  const filledBuckets = buckets.map((bucket) => {
    const row = rowsByBucket.get(bucket.bucketStartAt.toISOString());
    const distanceMeters = row?.distanceMeters ?? 0;
    const activityCount = row?.activityCount ?? 0;

    cumulativeDistanceMeters += distanceMeters;
    totalActivityCount += activityCount;

    return {
      ...bucket,
      activityCount,
      cumulativeDistanceMeters,
      distanceMeters,
    };
  });

  return {
    bucketMode,
    buckets: filledBuckets,
    totalActivityCount,
    totalDistanceMeters: cumulativeDistanceMeters,
    year,
  };
}

function createMonthlyBuckets(year: number): AnalyticsVolumeBucket[] {
  return Array.from({ length: 12 }, (_, month) => {
    const bucketStartAt = getBrisbaneCalendarDateStartAt(year, month, 1);
    const bucketEndAt = getBrisbaneCalendarDateStartAt(year, month + 1, 1);

    return createEmptyBucket({ bucketEndAt, bucketStartAt });
  });
}

function createWeeklyBuckets(year: number): AnalyticsVolumeBucket[] {
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
  };
}

function getBrisbaneCalendarDateStartAt(
  year: number,
  monthIndex: number,
  day: number,
) {
  return new Date(
    Date.UTC(year, monthIndex, day) -
      brisbaneUtcOffsetHours * millisecondsPerHour,
  );
}

function toDate(value: Date | string) {
  if (value instanceof Date) {
    return value;
  }

  return new Date(`${value.replace(" ", "T")}Z`);
}
