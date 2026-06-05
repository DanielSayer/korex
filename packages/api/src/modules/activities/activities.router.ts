import { ORPCError } from "@orpc/server";
import { Effect } from "effect";
import { protectedProcedure } from "../../index";
import {
  archiveTrainingGoalInput,
  createTrainingGoalInput,
  getActivityDetailSummaryInput,
  getActivityStreamsInput,
  getAnalyticsBestEffortsInput,
  getAnalyticsVolumeInput,
  getWeeklyTrainingSummaryInput,
  listActivitiesInput,
  regenerateWeeklyTrainingSummaryInput,
  updateTrainingGoalInput,
} from "./activities.inputs";
import { getAnalyticsVolume } from "./analytics/activity-analytics.repository";
import { getAnalyticsBestEfforts } from "./analytics/activity-best-effort-analytics.repository";
import { summarizeActivitiesByWeek } from "./catalog/activity-calendar-summary.service";
import {
  getRecentActivities,
  listActivitiesForDateRange,
} from "./catalog/activity-catalog.repository";
import { getActivityDetailSummary } from "./catalog/activity-detail-summary.service";
import { getActivityStreams } from "./catalog/activity-streams.service";
import { DashboardWeeklyDistanceLive } from "./dashboard/dashboard-weekly-distance.live";
import {
  getDashboardThisWeek,
  getDashboardWeeklyDistance,
} from "./dashboard/dashboard-weekly-distance.service";
import { listTrainingGoals } from "./training-goals/training-goal.repository";
import {
  archiveTrainingGoal,
  createTrainingGoal,
  listTrainingGoalProgress,
  updateTrainingGoal,
} from "./training-goals/training-goal.service";
import {
  TrainingGoalAlreadyExistsError,
  TrainingGoalNotFoundError,
  TrainingGoalTargetValueError,
} from "./training-goals/training-goal.types";
import {
  getTrainingStreak,
  listCurrentTrainingWeekQualifyingActivities,
} from "./training-streaks/training-streak.repository";
import {
  getWeeklyTrainingSummary,
  listWeeklyTrainingSummaries,
} from "./weekly-training-summaries/weekly-training-summary.repository";
import { enqueueWeeklyTrainingSummaryGeneration } from "./weekly-training-summaries/weekly-training-summary-jobs.repository";

export const activitiesRouter = {
  analyticsBestEfforts: protectedProcedure
    .input(getAnalyticsBestEffortsInput)
    .handler(async ({ context, input }) => {
      return getAnalyticsBestEfforts({
        userId: context.session.user.id,
        year: input.year,
      });
    }),
  analyticsVolume: protectedProcedure
    .input(getAnalyticsVolumeInput)
    .handler(async ({ context, input }) => {
      return getAnalyticsVolume({
        bucketMode: input.bucketMode,
        userId: context.session.user.id,
        year: input.year,
      });
    }),
  dashboardWeeklyDistance: protectedProcedure.handler(async ({ context }) => {
    return Effect.runPromise(
      getDashboardWeeklyDistance({
        userId: context.session.user.id,
      }).pipe(Effect.provide(DashboardWeeklyDistanceLive)),
    );
  }),
  dashboardThisWeek: protectedProcedure.handler(async ({ context }) => {
    return Effect.runPromise(
      getDashboardThisWeek({
        userId: context.session.user.id,
      }).pipe(Effect.provide(DashboardWeeklyDistanceLive)),
    );
  }),
  getWeeklyTrainingSummary: protectedProcedure
    .input(getWeeklyTrainingSummaryInput)
    .handler(async ({ context, input }) => {
      return getWeeklyTrainingSummary({
        userId: context.session.user.id,
        weekStartAt: input.weekStartAt,
      });
    }),
  summary: protectedProcedure
    .input(getActivityDetailSummaryInput)
    .handler(async ({ context, input }) => {
      return getActivityDetailSummary({
        activityId: input.activityId,
        userId: context.session.user.id,
      });
    }),
  streams: protectedProcedure
    .input(getActivityStreamsInput)
    .handler(async ({ context, input }) => {
      return getActivityStreams({
        activityId: input.activityId,
        userId: context.session.user.id,
      });
    }),
  list: protectedProcedure
    .input(listActivitiesInput)
    .handler(async ({ context, input }) => {
      const activities = await listActivitiesForDateRange({
        endDate: input.endDate,
        startDate: input.startDate,
        userId: context.session.user.id,
      });

      return {
        activities: activities.map(
          ({
            averageHeartRateBeatsPerMinute,
            distanceMeters,
            durationSeconds,
            id,
            name,
            startAt,
          }) => ({
            averageHeartRateBeatsPerMinute,
            distanceMeters,
            durationSeconds,
            id,
            name,
            startAt,
          }),
        ),
        summaries: summarizeActivitiesByWeek(activities),
      };
    }),
  recent: protectedProcedure.handler(async ({ context }) => {
    return getRecentActivities({
      userId: context.session.user.id,
    });
  }),
  regenerateWeeklyTrainingSummary: protectedProcedure
    .input(regenerateWeeklyTrainingSummaryInput)
    .handler(async ({ context, input }) => {
      await enqueueWeeklyTrainingSummaryGeneration({
        userId: context.session.user.id,
        weekStartAt: input.weekStartAt,
      });

      return { queued: true };
    }),
  trainingStreak: protectedProcedure.handler(async ({ context }) => {
    return getTrainingStreak({
      userId: context.session.user.id,
    });
  }),
  trainingStreakCurrentWeek: protectedProcedure.handler(async ({ context }) => {
    return listCurrentTrainingWeekQualifyingActivities({
      userId: context.session.user.id,
    });
  }),
  createTrainingGoal: protectedProcedure
    .input(createTrainingGoalInput)
    .handler(async ({ context, input }) => {
      try {
        return await createTrainingGoal({
          metric: input.metric,
          period: input.period,
          targetValue: input.targetValue,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toTrainingGoalOrpcError(error);
      }
    }),
  updateTrainingGoal: protectedProcedure
    .input(updateTrainingGoalInput)
    .handler(async ({ context, input }) => {
      try {
        return await updateTrainingGoal({
          id: input.id,
          targetValue: input.targetValue,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toTrainingGoalOrpcError(error);
      }
    }),
  archiveTrainingGoal: protectedProcedure
    .input(archiveTrainingGoalInput)
    .handler(async ({ context, input }) => {
      try {
        return await archiveTrainingGoal({
          id: input.id,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toTrainingGoalOrpcError(error);
      }
    }),
  trainingGoalProgress: protectedProcedure.handler(async ({ context }) => {
    return listTrainingGoalProgress({
      userId: context.session.user.id,
    });
  }),
  trainingGoals: protectedProcedure.handler(async ({ context }) => {
    return listTrainingGoals({
      userId: context.session.user.id,
    });
  }),
  weeklyTrainingSummaries: protectedProcedure.handler(async ({ context }) => {
    return listWeeklyTrainingSummaries({
      userId: context.session.user.id,
    });
  }),
};

function toTrainingGoalOrpcError(error: unknown) {
  if (error instanceof TrainingGoalAlreadyExistsError) {
    return new ORPCError("CONFLICT", {
      message:
        "An active Training Goal already exists for this metric, period, and sport scope.",
    });
  }

  if (error instanceof TrainingGoalTargetValueError) {
    return new ORPCError("BAD_REQUEST", {
      message: "Training Goal target value must be greater than zero.",
    });
  }

  if (error instanceof TrainingGoalNotFoundError) {
    return new ORPCError("NOT_FOUND", {
      message: "Active Training Goal was not found.",
    });
  }

  return error;
}
