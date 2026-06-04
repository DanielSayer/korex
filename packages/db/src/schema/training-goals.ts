import { relations, sql } from "drizzle-orm";
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

import { user } from "./auth";

export const trainingGoalMetric = pgEnum("training_goal_metric", [
  "distance",
  "activityCount",
]);

export const trainingGoalPeriod = pgEnum("training_goal_period", [
  "trainingWeek",
  "calendarMonth",
]);

export const trainingGoalSportScope = pgEnum("training_goal_sport_scope", [
  "running",
]);

export const trainingGoals = pgTable(
  "training_goals",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    metric: trainingGoalMetric("metric").notNull(),
    period: trainingGoalPeriod("period").notNull(),
    sportScope: trainingGoalSportScope("sport_scope").notNull(),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("training_goals_user_id_idx").on(table.userId),
    index("training_goals_user_active_idx").on(table.userId, table.archivedAt),
    uniqueIndex("training_goals_active_scope_idx")
      .on(table.userId, table.metric, table.period, table.sportScope)
      .where(sql`${table.archivedAt} is null`),
  ],
);

export const trainingGoalVersions = pgTable(
  "training_goal_versions",
  {
    id: serial("id").primaryKey(),
    trainingGoalId: integer("training_goal_id")
      .notNull()
      .references(() => trainingGoals.id, { onDelete: "cascade" }),
    targetValue: integer("target_value").notNull(),
    effectiveFromPeriodStartAt: timestamp(
      "effective_from_period_start_at",
    ).notNull(),
    effectiveUntilPeriodStartAt: timestamp("effective_until_period_start_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("training_goal_versions_goal_id_idx").on(table.trainingGoalId),
    index("training_goal_versions_effective_period_idx").on(
      table.trainingGoalId,
      table.effectiveFromPeriodStartAt,
      table.effectiveUntilPeriodStartAt,
    ),
    uniqueIndex("training_goal_versions_goal_from_period_idx").on(
      table.trainingGoalId,
      table.effectiveFromPeriodStartAt,
    ),
  ],
);

export const trainingGoalsRelations = relations(
  trainingGoals,
  ({ many, one }) => ({
    user: one(user, {
      fields: [trainingGoals.userId],
      references: [user.id],
    }),
    versions: many(trainingGoalVersions),
  }),
);

export const trainingGoalVersionsRelations = relations(
  trainingGoalVersions,
  ({ one }) => ({
    trainingGoal: one(trainingGoals, {
      fields: [trainingGoalVersions.trainingGoalId],
      references: [trainingGoals.id],
    }),
  }),
);
