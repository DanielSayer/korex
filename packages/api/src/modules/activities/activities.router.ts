import { z } from "zod";

import { protectedProcedure } from "../../index";
import { summarizeActivitiesByWeek } from "./activity-calendar-summary.service";
import {
  getRecentActivities,
  listActivitiesForDateRange,
} from "./activity-catalog.repository";
import {
  getWeeklyTrainingSummary,
  listWeeklyTrainingSummaries,
} from "./weekly-training-summary.repository";

const listActivitiesInput = z
  .object({
    endDate: z.coerce.date(),
    startDate: z.coerce.date(),
  })
  .refine((input) => input.startDate <= input.endDate, {
    message: "startDate must be before or equal to endDate",
    path: ["startDate"],
  });

export const activitiesRouter = {
  getWeeklyTrainingSummary: protectedProcedure
    .input(z.object({ weekStartAt: z.coerce.date() }))
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
