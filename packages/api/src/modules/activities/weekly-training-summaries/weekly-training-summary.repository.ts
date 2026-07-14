import { activities, db, weeklyTrainingSummaries } from "@korex/db";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import type {
  WeeklyTrainingSummaryDetail,
  WeeklyTrainingSummaryInput,
  WeeklyTrainingSummaryListItem,
} from "./weekly-training-summary.types";

type WeeklyTrainingSummaryDatabase = Pick<typeof db, "insert" | "select">;

export type WeeklyTrainingSummaryActivity = {
  averageSpeedMetersPerSecond: number | null;
  distanceMeters: number | null;
  id: number;
  movingTimeSeconds: number | null;
  name: string;
  startAt: Date;
};

export async function listWeeklyTrainingSummaries({
  userId,
}: {
  userId: string;
}): Promise<WeeklyTrainingSummaryListItem[]> {
  return db
    .select({
      activityCount: weeklyTrainingSummaries.activityCount,
      averageSpeedMetersPerSecond:
        weeklyTrainingSummaries.averageSpeedMetersPerSecond,
      generatedAt: weeklyTrainingSummaries.generatedAt,
      id: weeklyTrainingSummaries.id,
      previousWeekActivityCountDelta:
        weeklyTrainingSummaries.previousWeekActivityCountDelta,
      previousWeekAverageSpeedDeltaMetersPerSecond:
        weeklyTrainingSummaries.previousWeekAverageSpeedDeltaMetersPerSecond,
      previousWeekDistanceDeltaMeters:
        weeklyTrainingSummaries.previousWeekDistanceDeltaMeters,
      previousWeekMovingTimeDeltaSeconds:
        weeklyTrainingSummaries.previousWeekMovingTimeDeltaSeconds,
      totalDistanceMeters: weeklyTrainingSummaries.totalDistanceMeters,
      totalMovingTimeSeconds: weeklyTrainingSummaries.totalMovingTimeSeconds,
      weekEndAt: weeklyTrainingSummaries.weekEndAt,
      weekStartAt: weeklyTrainingSummaries.weekStartAt,
    })
    .from(weeklyTrainingSummaries)
    .where(eq(weeklyTrainingSummaries.userId, userId))
    .orderBy(desc(weeklyTrainingSummaries.weekStartAt));
}

export async function getWeeklyTrainingSummary({
  userId,
  weekStartAt,
}: {
  userId: string;
  weekStartAt: Date;
}): Promise<WeeklyTrainingSummaryDetail | null> {
  const [summary] = await db
    .select({
      activityCount: weeklyTrainingSummaries.activityCount,
      averageSpeedMetersPerSecond:
        weeklyTrainingSummaries.averageSpeedMetersPerSecond,
      generatedAt: weeklyTrainingSummaries.generatedAt,
      id: weeklyTrainingSummaries.id,
      longestActivityId: weeklyTrainingSummaries.longestActivityId,
      payload: weeklyTrainingSummaries.payload,
      previousWeekActivityCountDelta:
        weeklyTrainingSummaries.previousWeekActivityCountDelta,
      previousWeekAverageSpeedDeltaMetersPerSecond:
        weeklyTrainingSummaries.previousWeekAverageSpeedDeltaMetersPerSecond,
      previousWeekDistanceDeltaMeters:
        weeklyTrainingSummaries.previousWeekDistanceDeltaMeters,
      previousWeekMovingTimeDeltaSeconds:
        weeklyTrainingSummaries.previousWeekMovingTimeDeltaSeconds,
      totalDistanceMeters: weeklyTrainingSummaries.totalDistanceMeters,
      totalMovingTimeSeconds: weeklyTrainingSummaries.totalMovingTimeSeconds,
      weekEndAt: weeklyTrainingSummaries.weekEndAt,
      weekStartAt: weeklyTrainingSummaries.weekStartAt,
    })
    .from(weeklyTrainingSummaries)
    .where(
      and(
        eq(weeklyTrainingSummaries.userId, userId),
        eq(weeklyTrainingSummaries.weekStartAt, weekStartAt),
      ),
    );

  return summary ?? null;
}

export async function listActivitiesForTrainingWeek({
  database = db,
  userId,
  weekEndAt,
  weekStartAt,
}: {
  database?: WeeklyTrainingSummaryDatabase;
  userId: string;
  weekEndAt: Date;
  weekStartAt: Date;
}): Promise<WeeklyTrainingSummaryActivity[]> {
  return database
    .select({
      averageSpeedMetersPerSecond: activities.averageSpeedMetersPerSecond,
      distanceMeters: activities.distanceMeters,
      id: activities.id,
      movingTimeSeconds: activities.movingTimeSeconds,
      name: activities.name,
      startAt: activities.startAt,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        gte(activities.startAt, weekStartAt),
        lt(activities.startAt, weekEndAt),
      ),
    )
    .orderBy(desc(activities.startAt));
}

export async function upsertWeeklyTrainingSummary(
  input: WeeklyTrainingSummaryInput,
  database: WeeklyTrainingSummaryDatabase = db,
) {
  const now = new Date();

  await database
    .insert(weeklyTrainingSummaries)
    .values(input)
    .onConflictDoUpdate({
      target: [
        weeklyTrainingSummaries.userId,
        weeklyTrainingSummaries.weekStartAt,
      ],
      set: {
        activityCount: input.activityCount,
        averageSpeedMetersPerSecond: input.averageSpeedMetersPerSecond,
        generatedAt: input.generatedAt,
        longestActivityId: input.longestActivityId,
        payload: input.payload,
        previousWeekActivityCountDelta: input.previousWeekActivityCountDelta,
        previousWeekAverageSpeedDeltaMetersPerSecond:
          input.previousWeekAverageSpeedDeltaMetersPerSecond,
        previousWeekDistanceDeltaMeters: input.previousWeekDistanceDeltaMeters,
        previousWeekMovingTimeDeltaSeconds:
          input.previousWeekMovingTimeDeltaSeconds,
        totalDistanceMeters: input.totalDistanceMeters,
        totalMovingTimeSeconds: input.totalMovingTimeSeconds,
        updatedAt: now,
        weekEndAt: input.weekEndAt,
      },
    });
}
