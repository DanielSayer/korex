import { activities, db, trainingStreaks } from "@korex/db";
import { and, eq, gte, inArray, lt } from "drizzle-orm";
import {
  getNextTrainingWeekStartAt,
  getTrainingWeekStartAt,
} from "../weekly-training-summaries/training-week";
import { enqueueTrainingStreakUpdate } from "./training-streak-jobs.repository";
import { trainingStreakQualifyingSportTypes } from "./training-streaks";

type TrainingStreakDatabase = Pick<
  typeof db,
  "insert" | "select" | "transaction" | "update"
>;

export type TrainingStreak = {
  currentStreak: number;
  lastQualifiedWeekStartAt: Date | null;
  maxStreak: number;
  updatedAt: Date;
  userId: string;
};

export async function getTrainingStreak({
  userId,
}: {
  userId: string;
}): Promise<TrainingStreak | null> {
  const [streak] = await db
    .select({
      currentStreak: trainingStreaks.currentStreak,
      lastQualifiedWeekStartAt: trainingStreaks.lastQualifiedWeekStartAt,
      maxStreak: trainingStreaks.maxStreak,
      updatedAt: trainingStreaks.updatedAt,
      userId: trainingStreaks.userId,
    })
    .from(trainingStreaks)
    .where(eq(trainingStreaks.userId, userId));

  return streak ?? null;
}

export async function getTrainingStreakProjectionInputs({
  userId,
  weekStartAt,
}: {
  userId: string;
  weekStartAt: Date;
}) {
  const weekEndAt = getNextTrainingWeekStartAt(weekStartAt);

  const [streak, qualifyingActivity] = await Promise.all([
    getTrainingStreak({ userId }),
    db
      .select({ id: activities.id })
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          inArray(activities.sportType, trainingStreakQualifyingSportTypes),
          gte(activities.startAt, weekStartAt),
          lt(activities.startAt, weekEndAt),
        ),
      )
      .limit(1),
  ]);

  return {
    hasQualifyingActivity: qualifyingActivity.length > 0,
    streak,
  };
}

export async function enqueueCurrentTrainingStreakUpdateForActivity({
  activityStartAt,
  database = db,
  userId,
}: {
  activityStartAt: Date;
  database?: TrainingStreakDatabase;
  userId: string;
}) {
  await enqueueTrainingStreakUpdate({
    database,
    userId,
    weekStartAt: getTrainingWeekStartAt(activityStartAt),
  });
}

export async function upsertTrainingStreak(
  input: {
    currentStreak: number;
    lastQualifiedWeekStartAt: Date | null;
    maxStreak: number;
    userId: string;
  },
  database: TrainingStreakDatabase = db,
) {
  const now = new Date();

  await database
    .insert(trainingStreaks)
    .values({
      ...input,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [trainingStreaks.userId],
      set: {
        currentStreak: input.currentStreak,
        lastQualifiedWeekStartAt: input.lastQualifiedWeekStartAt,
        maxStreak: input.maxStreak,
        updatedAt: now,
      },
    });
}
