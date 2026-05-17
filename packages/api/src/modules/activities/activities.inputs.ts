import { z } from "zod";

const currentYear = new Date().getFullYear();

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

export const getAnalyticsVolumeInput = z.object({
  bucketMode: z.enum(["monthly", "weekly"]).default("monthly"),
  year: z.coerce.number().int().min(2000).max(currentYear).default(currentYear),
});
