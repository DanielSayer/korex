import { db } from "@korex/db";
import {
  getCompletedTrainingWeek,
  getNextTrainingWeekStartAt,
} from "./training-week";
import {
  enqueueWeeklyTrainingSummaryGeneration,
  listUsersWithActivitiesForTrainingWeek,
} from "./weekly-training-summary-jobs.repository";

type WeeklyTrainingSummaryScheduleDatabase = Pick<
  typeof db,
  "insert" | "select" | "selectDistinct"
>;

export async function enqueueCompletedWeeklyTrainingSummaries({
  database = db,
  now = new Date(),
  skipSucceeded = false,
}: {
  database?: WeeklyTrainingSummaryScheduleDatabase;
  now?: Date;
  skipSucceeded?: boolean;
} = {}) {
  const { weekStartAt } = getCompletedTrainingWeek(now);

  return enqueueWeeklyTrainingSummariesForWeek({
    database,
    skipSucceeded,
    weekStartAt,
  });
}

export async function enqueueWeeklyTrainingSummariesForWeek({
  database = db,
  skipSucceeded = false,
  weekStartAt,
}: {
  database?: WeeklyTrainingSummaryScheduleDatabase;
  skipSucceeded?: boolean;
  weekStartAt: Date;
}) {
  const weekEndAt = getNextTrainingWeekStartAt(weekStartAt);
  const userIds = await listUsersWithActivitiesForTrainingWeek({
    database,
    skipSucceeded,
    weekEndAt,
    weekStartAt,
  });

  for (const userId of userIds) {
    await enqueueWeeklyTrainingSummaryGeneration({
      database,
      userId,
      weekStartAt,
    });
  }

  return {
    enqueued: userIds.length,
    weekEndAt,
    weekStartAt,
  };
}
