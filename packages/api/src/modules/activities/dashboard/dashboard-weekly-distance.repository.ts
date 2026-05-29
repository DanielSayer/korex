import { activities, db } from "@korex/db";
import { and, asc, eq, gte, inArray, lt, sql } from "drizzle-orm";

import type { DashboardWeeklyDistanceRow } from "./dashboard-weekly-distance";

export async function listDashboardWeeklyDistanceRows({
  bucketEndAt,
  bucketStartAt,
  userId,
}: {
  bucketEndAt: Date;
  bucketStartAt: Date;
  userId: string;
}): Promise<DashboardWeeklyDistanceRow[]> {
  const bucketExpression = sql<Date>`date_trunc('week', ${activities.startAt} + interval '10 hours') - interval '10 hours'`;

  return db
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
        gte(activities.startAt, bucketStartAt),
        lt(activities.startAt, bucketEndAt),
      ),
    )
    .groupBy(bucketExpression)
    .orderBy(asc(bucketExpression));
}

export async function sumDashboardDistance({
  endAt,
  startAt,
  userId,
}: {
  endAt: Date;
  startAt: Date;
  userId: string;
}): Promise<number> {
  const [row] = await db
    .select({
      distanceMeters: sql<number>`coalesce(sum(${activities.distanceMeters}), 0)::float`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        inArray(activities.sportType, ["run", "treadmill"]),
        gte(activities.startAt, startAt),
        lt(activities.startAt, endAt),
      ),
    );

  return row?.distanceMeters ?? 0;
}
