import { activities, db } from "@korex/db";
import { and, asc, eq, gte, inArray, lt, sql } from "drizzle-orm";

import type {
  AnalyticsVolume,
  AnalyticsVolumeBucketMode,
} from "../activities.types";
import {
  buildAnalyticsVolume,
  createMonthlyAnalyticsVolumeBuckets,
  createWeeklyAnalyticsVolumeBuckets,
} from "./analytics-volume";

export async function getAnalyticsVolume({
  bucketMode,
  userId,
  year,
}: {
  bucketMode: AnalyticsVolumeBucketMode;
  userId: string;
  year: number;
}): Promise<AnalyticsVolume> {
  const chartBuckets =
    bucketMode === "monthly"
      ? createMonthlyAnalyticsVolumeBuckets(year)
      : createWeeklyAnalyticsVolumeBuckets(year);
  const monthlyBuckets = createMonthlyAnalyticsVolumeBuckets(year);
  const weeklyBuckets = createWeeklyAnalyticsVolumeBuckets(year);
  const firstBucket = monthlyBuckets.at(0);
  const lastBucket = monthlyBuckets.at(-1);

  if (!(firstBucket && lastBucket)) {
    return {
      bucketMode,
      buckets: [],
      monthlyBuckets: [],
      totalActivityCount: 0,
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      weeklyBuckets: [],
      year,
    };
  }

  const [chartRows, monthlyRows, weeklyRows] = await Promise.all([
    listAnalyticsVolumeRows({
      bucketMode,
      bucketEndAt: lastBucket.bucketEndAt,
      bucketStartAt: firstBucket.bucketStartAt,
      userId,
    }),
    bucketMode === "monthly"
      ? Promise.resolve(null)
      : listAnalyticsVolumeRows({
          bucketMode: "monthly",
          bucketEndAt: lastBucket.bucketEndAt,
          bucketStartAt: firstBucket.bucketStartAt,
          userId,
        }),
    bucketMode === "weekly"
      ? Promise.resolve(null)
      : listAnalyticsVolumeRows({
          bucketMode: "weekly",
          bucketEndAt: lastBucket.bucketEndAt,
          bucketStartAt: firstBucket.bucketStartAt,
          userId,
        }),
  ]);

  const analytics = buildAnalyticsVolume({
    bucketMode,
    buckets: chartBuckets,
    rows: chartRows,
    year,
  });

  return {
    ...analytics,
    monthlyBuckets:
      bucketMode === "monthly"
        ? analytics.buckets
        : buildAnalyticsVolume({
            bucketMode: "monthly",
            buckets: monthlyBuckets,
            rows: monthlyRows ?? [],
            year,
          }).buckets,
    weeklyBuckets:
      bucketMode === "weekly"
        ? analytics.buckets
        : buildAnalyticsVolume({
            bucketMode: "weekly",
            buckets: weeklyBuckets,
            rows: weeklyRows ?? [],
            year,
          }).buckets,
  };
}

async function listAnalyticsVolumeRows({
  bucketEndAt,
  bucketMode,
  bucketStartAt,
  userId,
}: {
  bucketEndAt: Date;
  bucketMode: AnalyticsVolumeBucketMode;
  bucketStartAt: Date;
  userId: string;
}) {
  const bucketExpression =
    bucketMode === "monthly"
      ? sql<Date>`date_trunc('month', ${activities.startAt} + interval '10 hours') - interval '10 hours'`
      : sql<Date>`date_trunc('week', ${activities.startAt} + interval '10 hours') - interval '10 hours'`;

  return db
    .select({
      activityCount: sql<number>`count(*)::int`,
      bucketStartAt: bucketExpression,
      distanceMeters: sql<number>`coalesce(sum(${activities.distanceMeters}), 0)::float`,
      durationSeconds: sql<number>`coalesce(sum(${activities.movingTimeSeconds}), 0)::int`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        inArray(activities.sportType, ["run", "treadmill"]),
        gte(activities.startAt, bucketStartAt),
        lt(activities.startAt, bucketEndAt),
      ),
    )
    .groupBy(bucketExpression)
    .orderBy(asc(bucketExpression));
}
