import { activityBestEfforts, db, personalBestEfforts } from "@korex/db";
import { and, asc, eq, lt } from "drizzle-orm";

import type { AnalyticsBestEfforts } from "../activities.types";
import {
  buildMonthlyBestEffortTrendBuckets,
  createMonthlyBestEffortBuckets,
  sortByStandardDistance,
  toPersonalBestEffort,
} from "./analytics-best-efforts";

export async function getAnalyticsBestEfforts({
  userId,
  year,
}: {
  userId: string;
  year: number;
}): Promise<AnalyticsBestEfforts> {
  const monthlyBuckets = createMonthlyBestEffortBuckets(year);
  const lastBucket = monthlyBuckets.at(-1);

  if (!lastBucket) {
    return {
      allTime: [],
      monthlyTrendBuckets: [],
      year,
    };
  }

  const [allTimeRows, historicalRows] = await Promise.all([
    listPersonalBestEfforts({ userId }),
    listActivityBestEffortsThrough({
      endAt: lastBucket.bucketEndAt,
      userId,
    }),
  ]);

  return {
    allTime: sortByStandardDistance(allTimeRows.map(toPersonalBestEffort)),
    monthlyTrendBuckets: buildMonthlyBestEffortTrendBuckets({
      buckets: monthlyBuckets,
      rows: historicalRows,
    }),
    year,
  };
}

async function listPersonalBestEfforts({ userId }: { userId: string }) {
  return db
    .select({
      activityId: personalBestEfforts.activityId,
      activityStartAt: personalBestEfforts.activityStartAt,
      distanceMeters: personalBestEfforts.distanceMeters,
      durationSeconds: personalBestEfforts.durationSeconds,
      standardDistanceCode: personalBestEfforts.standardDistanceCode,
    })
    .from(personalBestEfforts)
    .where(eq(personalBestEfforts.userId, userId));
}

async function listActivityBestEffortsThrough({
  endAt,
  userId,
}: {
  endAt: Date;
  userId: string;
}) {
  return db
    .select({
      activityId: activityBestEfforts.activityId,
      activityStartAt: activityBestEfforts.activityStartAt,
      distanceMeters: activityBestEfforts.distanceMeters,
      durationSeconds: activityBestEfforts.durationSeconds,
      standardDistanceCode: activityBestEfforts.standardDistanceCode,
    })
    .from(activityBestEfforts)
    .where(
      and(
        eq(activityBestEfforts.userId, userId),
        lt(activityBestEfforts.activityStartAt, endAt),
      ),
    )
    .orderBy(
      asc(activityBestEfforts.activityStartAt),
      asc(activityBestEfforts.durationSeconds),
      asc(activityBestEfforts.id),
    );
}
