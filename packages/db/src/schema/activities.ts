import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const activitySportType = pgEnum("activity_sport_type", [
  "run",
  "treadmill",
  "hike",
]);

export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sportType: activitySportType("sport_type").notNull(),
    startAt: timestamp("start_at").notNull(),
    deviceName: text("device_name"),
    movingTimeSeconds: integer("moving_time_seconds"),
    elapsedTimeSeconds: integer("elapsed_time_seconds"),
    distanceMeters: doublePrecision("distance_meters"),
    totalElevationGainMeters: doublePrecision("total_elevation_gain_meters"),
    totalElevationLossMeters: doublePrecision("total_elevation_loss_meters"),
    averageSpeedMetersPerSecond: doublePrecision(
      "average_speed_meters_per_second",
    ),
    maxSpeedMetersPerSecond: doublePrecision("max_speed_meters_per_second"),
    averageHeartRateBeatsPerMinute: integer(
      "average_heart_rate_beats_per_minute",
    ),
    maxHeartRateBeatsPerMinute: integer("max_heart_rate_beats_per_minute"),
    averageCadenceStepsPerMinute: integer("average_cadence_steps_per_minute"),
    energyKilocalories: integer("energy_kilocalories"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("activities_user_id_idx").on(table.userId),
    index("activities_user_start_at_idx").on(table.userId, table.startAt),
    index("activities_user_sport_type_idx").on(table.userId, table.sportType),
  ],
);

export const activityLaps = pgTable(
  "activity_laps",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    distanceMeters: doublePrecision("distance_meters").notNull(),
    movingTimeSeconds: integer("moving_time_seconds"),
    elapsedTimeSeconds: integer("elapsed_time_seconds"),
    startTimeSeconds: integer("start_time_seconds").notNull(),
    endTimeSeconds: integer("end_time_seconds").notNull(),
    averageSpeedMetersPerSecond: doublePrecision(
      "average_speed_meters_per_second",
    ),
    maxSpeedMetersPerSecond: doublePrecision("max_speed_meters_per_second"),
    averageHeartRateBeatsPerMinute: integer(
      "average_heart_rate_beats_per_minute",
    ),
    maxHeartRateBeatsPerMinute: integer("max_heart_rate_beats_per_minute"),
    averageCadenceStepsPerMinute: integer("average_cadence_steps_per_minute"),
    averageStrideLengthMeters: doublePrecision("average_stride_length_meters"),
    totalElevationGainMeters: doublePrecision("total_elevation_gain_meters"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("activity_laps_activity_id_idx").on(table.activityId),
    uniqueIndex("activity_laps_activity_index_idx").on(
      table.activityId,
      table.index,
    ),
  ],
);

export const activitiesRelations = relations(activities, ({ many, one }) => ({
  laps: many(activityLaps),
  user: one(user, {
    fields: [activities.userId],
    references: [user.id],
  }),
}));

export const activityLapsRelations = relations(activityLaps, ({ one }) => ({
  activity: one(activities, {
    fields: [activityLaps.activityId],
    references: [activities.id],
  }),
}));
