import { db, trainingStreaks } from "@korex/db";
import { and, gt, isNotNull, lt } from "drizzle-orm";
import { enqueueJob } from "../../job-runtime/job-runtime";
import { getCompletedTrainingWeek } from "../weekly-training-summaries/training-week";
import { trainingStreakJobName } from "./training-streak-job";

type TrainingStreakJobDatabase = Pick<typeof db, "insert" | "select">;

export async function enqueueTrainingStreakUpdate({
  database = db,
  runAfter,
  userId,
  weekStartAt,
}: {
  database?: TrainingStreakJobDatabase;
  runAfter?: Date;
  userId: string;
  weekStartAt: Date;
}) {
  return enqueueJob({
    database,
    key: `${userId}:${weekStartAt.toISOString()}`,
    name: trainingStreakJobName,
    payload: { userId, weekStartAt: weekStartAt.toISOString() },
    runAfter,
  });
}

export async function enqueueCompletedTrainingStreakUpdates({
  now = new Date(),
}: {
  now?: Date;
} = {}) {
  const { weekStartAt } = getCompletedTrainingWeek(now);
  const activeStreaks = await db
    .select({ userId: trainingStreaks.userId })
    .from(trainingStreaks)
    .where(
      and(
        gt(trainingStreaks.currentStreak, 0),
        isNotNull(trainingStreaks.lastQualifiedWeekStartAt),
        lt(trainingStreaks.lastQualifiedWeekStartAt, weekStartAt),
      ),
    );

  for (const streak of activeStreaks) {
    await enqueueTrainingStreakUpdate({
      userId: streak.userId,
      weekStartAt,
    });
  }

  return {
    enqueued: activeStreaks.length,
    weekStartAt,
  };
}
