import {
  listActivitiesForTrainingWeek,
  upsertWeeklyTrainingSummary,
  type WeeklyTrainingSummaryActivity,
} from "./weekly-training-summary.repository";
import {
  getTrainingWeekEndAt,
  markWeeklyTrainingSummaryGenerationFailed,
  markWeeklyTrainingSummaryGenerationSucceeded,
  type WeeklyTrainingSummaryGenerationJob,
} from "./weekly-training-summary-jobs.repository";

export async function processWeeklyTrainingSummaryGenerationJob(
  job: WeeklyTrainingSummaryGenerationJob,
) {
  try {
    const weekEndAt = getTrainingWeekEndAt(job.weekStartAt);
    const previousWeekStartAt = new Date(
      job.weekStartAt.getTime() - 7 * 24 * 60 * 60 * 1000,
    );

    const [currentActivities, previousActivities] = await Promise.all([
      listActivitiesForTrainingWeek({
        userId: job.userId,
        weekEndAt,
        weekStartAt: job.weekStartAt,
      }),
      listActivitiesForTrainingWeek({
        userId: job.userId,
        weekEndAt: job.weekStartAt,
        weekStartAt: previousWeekStartAt,
      }),
    ]);

    if (currentActivities.length === 0) {
      throw new Error("Weekly Training Summary requires at least one Activity");
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

    await upsertWeeklyTrainingSummary({
      activityCount: currentTotals.activityCount,
      averageSpeedMetersPerSecond: currentTotals.averageSpeedMetersPerSecond,
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
        currentTotals.totalDistanceMeters - previousTotals.totalDistanceMeters,
      previousWeekMovingTimeDeltaSeconds:
        currentTotals.totalMovingTimeSeconds -
        previousTotals.totalMovingTimeSeconds,
      totalDistanceMeters: currentTotals.totalDistanceMeters,
      totalMovingTimeSeconds: currentTotals.totalMovingTimeSeconds,
      userId: job.userId,
      weekEndAt,
      weekStartAt: job.weekStartAt,
    });
    await markWeeklyTrainingSummaryGenerationSucceeded({
      jobId: job.id,
    });
  } catch (error) {
    await markWeeklyTrainingSummaryGenerationFailed({
      error: error instanceof Error ? error.message : "Unknown error",
      jobId: job.id,
    });
  }
}

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
