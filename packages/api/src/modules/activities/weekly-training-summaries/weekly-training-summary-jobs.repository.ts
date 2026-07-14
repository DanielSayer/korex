import { activities, db, weeklyTrainingSummaries } from "@korex/db";
import { and, eq, gte, isNull, lt } from "drizzle-orm";
import { enqueueJob } from "../../job-runtime/job-runtime";
import { weeklyTrainingSummaryJobDefinition } from "../activity-job-definitions";

type WeeklyTrainingSummaryJobDatabase = Pick<
  typeof db,
  "insert" | "select" | "selectDistinct"
>;

export async function enqueueWeeklyTrainingSummaryGeneration({
  database = db,
  userId,
  weekStartAt,
}: {
  database?: WeeklyTrainingSummaryJobDatabase;
  userId: string;
  weekStartAt: Date;
}) {
  return enqueueJob({
    database,
    key: `${userId}:${weekStartAt.toISOString()}`,
    name: weeklyTrainingSummaryJobDefinition.name,
    payload: { userId, weekStartAt: weekStartAt.toISOString() },
  });
}

export async function listUsersWithActivitiesForTrainingWeek({
  database = db,
  skipSucceeded = false,
  weekEndAt,
  weekStartAt,
}: {
  database?: WeeklyTrainingSummaryJobDatabase;
  skipSucceeded?: boolean;
  weekEndAt: Date;
  weekStartAt: Date;
}) {
  const activityWeekCondition = and(
    gte(activities.startAt, weekStartAt),
    lt(activities.startAt, weekEndAt),
  );
  const usersQuery = database
    .selectDistinct({ userId: activities.userId })
    .from(activities);

  const users = skipSucceeded
    ? await usersQuery
        .leftJoin(
          weeklyTrainingSummaries,
          and(
            eq(weeklyTrainingSummaries.userId, activities.userId),
            eq(weeklyTrainingSummaries.weekStartAt, weekStartAt),
          ),
        )
        .where(and(activityWeekCondition, isNull(weeklyTrainingSummaries.id)))
    : await usersQuery.where(activityWeekCondition);

  return users.map((user) => user.userId);
}
