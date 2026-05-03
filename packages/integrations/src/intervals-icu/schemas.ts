import { z } from "zod";

const nullableString = z.string().nullable().optional();

const intervalsIcuSportsSettingsSchema = z
  .object({
    hr_zone_names: z.array(z.string()).optional(),
    hr_zones: z.array(z.number().int().positive()).optional(),
  })
  .loose();

export const intervalsIcuAthleteProfileSchema = z
  .object({
    email: nullableString,
    firstname: nullableString,
    id: z.string().min(1),
    lastname: nullableString,
    name: nullableString,
    sportsSettings: z.array(intervalsIcuSportsSettingsSchema).optional(),
    timezone: nullableString,
  })
  .loose();

export type IntervalsIcuAthleteProfile = z.infer<
  typeof intervalsIcuAthleteProfileSchema
>;

const intervalsIcuActivityId = z.string().min(1);

export const intervalsIcuActivityListItemSchema = z
  .object({
    id: intervalsIcuActivityId,
  })
  .loose();

export const intervalsIcuActivityListSchema = z.array(
  intervalsIcuActivityListItemSchema,
);

export const intervalsIcuActivityDetailSchema = z
  .object({
    id: intervalsIcuActivityId,
    start_date_local: z.iso.datetime().optional(),
    start_date: z.iso.datetime().optional(),
    start_time: z.iso.datetime().optional(),
    end_date_local: z.iso.datetime().optional(),
    end_date: z.iso.datetime().optional(),
    type: nullableString,
    sport: nullableString,
    category: nullableString,
    source: nullableString,
    updated: z.iso.datetime().optional(),
    updated_at: z.iso.datetime().optional(),
  })
  .loose();

export const intervalsIcuActivityMapSchema = z.unknown();

export const intervalsIcuActivityStreamsSchema = z.record(
  z.string(),
  z.unknown(),
);

export type IntervalsIcuActivityListItem = z.infer<
  typeof intervalsIcuActivityListItemSchema
>;
export type IntervalsIcuActivityDetail = z.infer<
  typeof intervalsIcuActivityDetailSchema
>;
export type IntervalsIcuActivityMap = z.infer<
  typeof intervalsIcuActivityMapSchema
>;
export type IntervalsIcuActivityStreams = z.infer<
  typeof intervalsIcuActivityStreamsSchema
>;
