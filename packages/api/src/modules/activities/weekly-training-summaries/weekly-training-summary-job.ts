import { weeklyTrainingSummaryJobDefinition } from "../activity-job-definitions";
import {
  getNextTrainingWeekStartAt,
  getPreviousTrainingWeekStartAt,
} from "./training-week";
import {
  listActivitiesForTrainingWeek,
  upsertWeeklyTrainingSummary,
  type WeeklyTrainingSummaryActivity,
} from "./weekly-training-summary.repository";

export const weeklyTrainingSummaryJobModule =
  weeklyTrainingSummaryJobDefinition.implement(
    async ({ userId, weekStartAt }, context) => {
      const weekEndAt = getNextTrainingWeekStartAt(weekStartAt);
      const previousWeekStartAt = getPreviousTrainingWeekStartAt(weekStartAt);

      const [currentActivities, previousActivities] = await Promise.all([
        listActivitiesForTrainingWeek({
          database: context.database,
          userId,
          weekEndAt,
          weekStartAt,
        }),
        listActivitiesForTrainingWeek({
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
      await upsertWeeklyTrainingSummary(
        {
          activityCount: currentTotals.activityCount,
          averageSpeedMetersPerSecond:
            currentTotals.averageSpeedMetersPerSecond,
          generatedAt: new Date(),
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
  );

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
