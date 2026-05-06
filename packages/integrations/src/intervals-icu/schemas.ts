import { z } from "zod";

const nullableString = z.string().nullable().optional();
const providerDateTimeString = z.string().nullable().optional();

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
    sportSettings: z.array(intervalsIcuSportsSettingsSchema).optional(),
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
    average_cadence: z.number().optional(),
    average_heartrate: z.number().optional(),
    average_speed: z.number().optional(),
    calories: z.number().optional(),
    category: nullableString,
    device_name: nullableString,
    distance: z.number().optional(),
    elapsed_time: z.number().optional(),
    end_date: providerDateTimeString,
    end_date_local: providerDateTimeString,
    id: intervalsIcuActivityId,
    icu_intervals: z.array(z.unknown()).optional(),
    max_heartrate: z.number().optional(),
    max_speed: z.number().optional(),
    moving_time: z.number().optional(),
    name: nullableString,
    sport: nullableString,
    start_date: providerDateTimeString,
    start_date_local: providerDateTimeString,
    start_time: providerDateTimeString,
    source: nullableString,
    total_elevation_gain: z.number().optional(),
    total_elevation_loss: z.number().optional(),
    type: nullableString,
    updated_at: providerDateTimeString,
    updated: providerDateTimeString,
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
