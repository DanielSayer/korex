import { z } from "zod";

const nullableString = z.string().nullable().optional();

export const intervalsIcuAthleteProfileSchema = z
  .object({
    email: nullableString,
    firstname: nullableString,
    id: z.string().min(1),
    lastname: nullableString,
    name: nullableString,
    timezone: nullableString,
  })
  .loose();

export type IntervalsIcuAthleteProfile = z.infer<
  typeof intervalsIcuAthleteProfileSchema
>;
