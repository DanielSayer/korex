import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { activities } from "./activities";

export const activityHeartRateZoneTimeCalculationJobStatus = pgEnum(
  "activity_heart_rate_zone_time_calculation_job_status",
  ["pending", "processing", "succeeded", "failed"],
);

export const activityHeartRateZoneTimeCalculationJobs = pgTable(
  "activity_heart_rate_zone_time_calculation_jobs",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    status: activityHeartRateZoneTimeCalculationJobStatus("status")
      .default("pending")
      .notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    lastError: text("last_error"),
    runAfter: timestamp("run_after").defaultNow().notNull(),
    lockedAt: timestamp("locked_at"),
    lockedBy: text("locked_by"),
    finishedAt: timestamp("finished_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("activity_hr_zone_time_jobs_activity_id_idx").on(
      table.activityId,
    ),
    index("activity_hr_zone_time_jobs_status_run_after_idx").on(
      table.status,
      table.runAfter,
    ),
    index("activity_hr_zone_time_jobs_locked_at_idx").on(table.lockedAt),
  ],
);

export const activityHeartRateZoneTimeCalculationJobsRelations = relations(
  activityHeartRateZoneTimeCalculationJobs,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityHeartRateZoneTimeCalculationJobs.activityId],
      references: [activities.id],
    }),
  }),
);

export const activityRouteHeatmapCalculationJobStatus = pgEnum(
  "activity_route_heatmap_calculation_job_status",
  ["pending", "processing", "succeeded", "failed"],
);

export const activityRouteHeatmapCalculationJobs = pgTable(
  "activity_route_heatmap_calculation_jobs",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    status: activityRouteHeatmapCalculationJobStatus("status")
      .default("pending")
      .notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    lastError: text("last_error"),
    runAfter: timestamp("run_after").defaultNow().notNull(),
    lockedAt: timestamp("locked_at"),
    lockedBy: text("locked_by"),
    finishedAt: timestamp("finished_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("activity_route_heatmap_jobs_activity_id_idx").on(
      table.activityId,
    ),
    index("activity_route_heatmap_jobs_status_run_after_idx").on(
      table.status,
      table.runAfter,
    ),
    index("activity_route_heatmap_jobs_locked_at_idx").on(table.lockedAt),
  ],
);

export const activityRouteHeatmapCalculationJobsRelations = relations(
  activityRouteHeatmapCalculationJobs,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityRouteHeatmapCalculationJobs.activityId],
      references: [activities.id],
    }),
  }),
);

export const activityBestEffortCalculationJobStatus = pgEnum(
  "activity_best_effort_calculation_job_status",
  ["pending", "processing", "succeeded", "failed"],
);

export const activityBestEffortCalculationJobs = pgTable(
  "activity_best_effort_calculation_jobs",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    status: activityBestEffortCalculationJobStatus("status")
      .default("pending")
      .notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    lastError: text("last_error"),
    runAfter: timestamp("run_after").defaultNow().notNull(),
    lockedAt: timestamp("locked_at"),
    lockedBy: text("locked_by"),
    finishedAt: timestamp("finished_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("activity_best_effort_jobs_activity_id_idx").on(
      table.activityId,
    ),
    index("activity_best_effort_jobs_status_run_after_idx").on(
      table.status,
      table.runAfter,
    ),
    index("activity_best_effort_jobs_locked_at_idx").on(table.lockedAt),
  ],
);

export const activityBestEffortCalculationJobsRelations = relations(
  activityBestEffortCalculationJobs,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityBestEffortCalculationJobs.activityId],
      references: [activities.id],
    }),
  }),
);
