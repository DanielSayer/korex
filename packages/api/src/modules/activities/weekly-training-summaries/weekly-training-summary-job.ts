import type { JobHandler } from "../../job-runtime/job-runtime";
import {
  getNextTrainingWeekStartAt,
  getPreviousTrainingWeekStartAt,
} from "./training-week";
import {
  listActivitiesForTrainingWeek,
  upsertWeeklyTrainingSummary,
  type WeeklyTrainingSummaryActivity,
} from "./weekly-training-summary.repository";

export const weeklyTrainingSummaryJobName = "weekly-training-summary.generate";

type WeeklyTrainingSummaryJobDependencies = {
  listActivities: typeof listActivitiesForTrainingWeek;
  now: () => Date;
  upsertSummary: typeof upsertWeeklyTrainingSummary;
};

export function createWeeklyTrainingSummaryJobModule(
  dependencies: WeeklyTrainingSummaryJobDependencies,
) {
  return {
    handler: async (
      payload: Record<string, unknown>,
      context: Parameters<JobHandler>[1],
    ) => {
      context.signal.throwIfAborted();
      const userId = requiredUserId(payload);
      const weekStartAt = requiredWeekStartAt(payload);
      const weekEndAt = getNextTrainingWeekStartAt(weekStartAt);
      const previousWeekStartAt = getPreviousTrainingWeekStartAt(weekStartAt);

      const [currentActivities, previousActivities] = await Promise.all([
        dependencies.listActivities({
          database: context.database,
          userId,
          weekEndAt,
          weekStartAt,
        }),
        dependencies.listActivities({
          database: context.database,
          userId,
          weekEndAt: weekStartAt,
          weekStartAt: previousWeekStartAt,
        }),
      ]);

      if (currentActivities.length === 0) {
        throw new Error(
          "Weekly Training Summary requires at least one Activity",
        );
      }

      const currentTotals = summarizeActivities(currentActivities);
      const previousTotals = summarizeActivities(previousActivities);
      const longestActivity = findLongestActivity(currentActivities);
      const averageSpeedDelta =
        currentTotals.averageSpeedMetersPerSecond === null ||
        previousTotals.averageSpeedMetersPerSecond === null
          ? null
          : currentTotals.averageSpeedMetersPerSecond -
            previousTotals.averageSpeedMetersPerSecond;

      context.signal.throwIfAborted();
      await dependencies.upsertSummary(
        {
          activityCount: currentTotals.activityCount,
          averageSpeedMetersPerSecond:
            currentTotals.averageSpeedMetersPerSecond,
          generatedAt: dependencies.now(),
          longestActivityId: longestActivity?.id ?? null,
          payload: {
            highlights: {
              longestActivity: longestActivity
                ? {
                    distanceMeters: longestActivity.distanceMeters,
                    id: longestActivity.id,
                    name: longestActivity.name,
                    startAt: longestActivity.startAt.toISOString(),
                  }
                : null,
            },
            previousWeek: {
              activityCount: previousTotals.activityCount,
              averageSpeedMetersPerSecond:
                previousTotals.averageSpeedMetersPerSecond,
              totalDistanceMeters: previousTotals.totalDistanceMeters,
              totalMovingTimeSeconds: previousTotals.totalMovingTimeSeconds,
              weekStartAt: previousWeekStartAt.toISOString(),
            },
          },
          previousWeekActivityCountDelta:
            currentTotals.activityCount - previousTotals.activityCount,
          previousWeekAverageSpeedDeltaMetersPerSecond: averageSpeedDelta,
          previousWeekDistanceDeltaMeters:
            currentTotals.totalDistanceMeters -
            previousTotals.totalDistanceMeters,
          previousWeekMovingTimeDeltaSeconds:
            currentTotals.totalMovingTimeSeconds -
            previousTotals.totalMovingTimeSeconds,
          totalDistanceMeters: currentTotals.totalDistanceMeters,
          totalMovingTimeSeconds: currentTotals.totalMovingTimeSeconds,
          userId,
          weekEndAt,
          weekStartAt,
        },
        context.database,
      );
    },
    name: weeklyTrainingSummaryJobName,
  };
}

export const weeklyTrainingSummaryJobModule =
  createWeeklyTrainingSummaryJobModule({
    listActivities: listActivitiesForTrainingWeek,
    now: () => new Date(),
    upsertSummary: upsertWeeklyTrainingSummary,
  });

function summarizeActivities(activities: WeeklyTrainingSummaryActivity[]) {
  const totalDistanceMeters = activities.reduce(
    (sum, activity) => sum + (activity.distanceMeters ?? 0),
    0,
  );
  const totalMovingTimeSeconds = activities.reduce(
    (sum, activity) => sum + (activity.movingTimeSeconds ?? 0),
    0,
  );

  return {
    activityCount: activities.length,
    averageSpeedMetersPerSecond:
      totalMovingTimeSeconds === 0
        ? null
        : totalDistanceMeters / totalMovingTimeSeconds,
    totalDistanceMeters,
    totalMovingTimeSeconds,
  };
}

function findLongestActivity(activities: WeeklyTrainingSummaryActivity[]) {
  return activities.reduce<WeeklyTrainingSummaryActivity | null>(
    (longest, activity) => {
      if (!longest) {
        return activity;
      }

      return (activity.distanceMeters ?? 0) > (longest.distanceMeters ?? 0)
        ? activity
        : longest;
    },
    null,
  );
}

function requiredUserId(payload: Record<string, unknown>) {
  if (typeof payload.userId !== "string" || payload.userId.length === 0) {
    throw new Error("Weekly Training Summary job requires a userId");
  }

  return payload.userId;
}

function requiredWeekStartAt(payload: Record<string, unknown>) {
  const weekStartAt = new Date(String(payload.weekStartAt));

  if (Number.isNaN(weekStartAt.getTime())) {
    throw new Error("Weekly Training Summary job requires a valid weekStartAt");
  }

  return weekStartAt;
}
