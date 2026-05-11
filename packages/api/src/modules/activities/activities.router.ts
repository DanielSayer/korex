import { z } from "zod";

import { protectedProcedure } from "../../index";
import {
  getRecentActivities,
  listActivitiesForDateRange,
} from "./activity-catalog.repository";

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
  list: protectedProcedure
    .input(listActivitiesInput)
    .handler(async ({ context, input }) => {
      return listActivitiesForDateRange({
        endDate: input.endDate,
        startDate: input.startDate,
        userId: context.session.user.id,
      });
    }),
  recent: protectedProcedure.handler(async ({ context }) => {
    return getRecentActivities({
      userId: context.session.user.id,
    });
  }),
};
