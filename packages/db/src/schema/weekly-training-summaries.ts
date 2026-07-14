import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export type WeeklyTrainingSummaryPayloadJson = {
  highlights: {
    longestActivity: {
      distanceMeters: number | null;
      id: number;
      name: string;
      startAt: string;
    } | null;
  };
  previousWeek: {
    activityCount: number;
    averageSpeedMetersPerSecond: number | null;
    totalDistanceMeters: number;
    totalMovingTimeSeconds: number;
    weekStartAt: string;
  };
};

export const weeklyTrainingSummaries = pgTable(
  "weekly_training_summaries",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    weekStartAt: timestamp("week_start_at").notNull(),
    weekEndAt: timestamp("week_end_at").notNull(),
    generatedAt: timestamp("generated_at").notNull(),
    activityCount: integer("activity_count").notNull(),
    totalDistanceMeters: doublePrecision("total_distance_meters").notNull(),
    totalMovingTimeSeconds: integer("total_moving_time_seconds").notNull(),
    averageSpeedMetersPerSecond: doublePrecision(
      "average_speed_meters_per_second",
    ),
    previousWeekActivityCountDelta: integer(
      "previous_week_activity_count_delta",
    ).notNull(),
    previousWeekDistanceDeltaMeters: doublePrecision(
      "previous_week_distance_delta_meters",
    ).notNull(),
    previousWeekMovingTimeDeltaSeconds: integer(
      "previous_week_moving_time_delta_seconds",
    ).notNull(),
    previousWeekAverageSpeedDeltaMetersPerSecond: doublePrecision(
      "previous_week_average_speed_delta_meters_per_second",
    ),
    longestActivityId: integer("longest_activity_id"),
    payload: jsonb("payload")
      .$type<WeeklyTrainingSummaryPayloadJson>()
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("weekly_training_summaries_user_week_idx").on(
      table.userId,
      table.weekStartAt,
    ),
    index("weekly_training_summaries_user_generated_idx").on(
      table.userId,
      table.generatedAt,
    ),
  ],
);

export const weeklyTrainingSummariesRelations = relations(
  weeklyTrainingSummaries,
  ({ one }) => ({
    user: one(user, {
      fields: [weeklyTrainingSummaries.userId],
      references: [user.id],
    }),
  }),
);
