import { Effect } from "effect";
import { protectedProcedure } from "../../index";
import {
  getActivityDetailSummaryInput,
  getActivityStreamsInput,
  getAnalyticsBestEffortsInput,
  getAnalyticsVolumeInput,
  getWeeklyTrainingSummaryInput,
  listActivitiesInput,
  regenerateWeeklyTrainingSummaryInput,
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
import { getDashboardWeeklyDistance } from "./dashboard/dashboard-weekly-distance.service";
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
  weeklyTrainingSummaries: protectedProcedure.handler(async ({ context }) => {
    return listWeeklyTrainingSummaries({
      userId: context.session.user.id,
    });
  }),
};
