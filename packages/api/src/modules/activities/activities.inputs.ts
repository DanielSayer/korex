import { z } from "zod";

export const listActivitiesInput = z
  .object({
    endDate: z.coerce.date(),
    startDate: z.coerce.date(),
  })
  .refine((input) => input.startDate <= input.endDate, {
    message: "startDate must be before or equal to endDate",
    path: ["startDate"],
  });

export const getWeeklyTrainingSummaryInput = z.object({
  weekStartAt: z.coerce.date(),
});
