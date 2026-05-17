import { protectedProcedure } from "../../index";
import {
  getWeeklyTrainingSummaryInput,
  listActivitiesInput,
} from "./activities.inputs";
import { summarizeActivitiesByWeek } from "./catalog/activity-calendar-summary.service";
import {
  getRecentActivities,
  listActivitiesForDateRange,
} from "./catalog/activity-catalog.repository";
import {
  getWeeklyTrainingSummary,
  listWeeklyTrainingSummaries,
} from "./weekly-training-summaries/weekly-training-summary.repository";

export const activitiesRouter = {
  getWeeklyTrainingSummary: protectedProcedure
    .input(getWeeklyTrainingSummaryInput)
    .handler(async ({ context, input }) => {
      return getWeeklyTrainingSummary({
        userId: context.session.user.id,
        weekStartAt: input.weekStartAt,
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
            name,
            startAt,
          }) => ({
            averageHeartRateBeatsPerMinute,
            distanceMeters,
            durationSeconds,
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
  weeklyTrainingSummaries: protectedProcedure.handler(async ({ context }) => {
    return listWeeklyTrainingSummaries({
      userId: context.session.user.id,
    });
  }),
};
