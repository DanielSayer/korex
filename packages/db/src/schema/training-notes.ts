import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { activities } from "./activities";
import { user } from "./auth";

export const trainingNotes = pgTable(
  "training_notes",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activityId: integer("activity_id").references(() => activities.id, {
      onDelete: "cascade",
    }),
    weekStartAt: timestamp("week_start_at"),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    check(
      "training_notes_exactly_one_target_check",
      sql`(${table.activityId} is not null and ${table.weekStartAt} is null) or (${table.activityId} is null and ${table.weekStartAt} is not null)`,
    ),
    index("training_notes_user_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
    index("training_notes_activity_id_idx").on(table.activityId),
    index("training_notes_user_week_start_at_idx").on(
      table.userId,
      table.weekStartAt,
    ),
  ],
);

export const trainingNotesRelations = relations(trainingNotes, ({ one }) => ({
  activity: one(activities, {
    fields: [trainingNotes.activityId],
    references: [activities.id],
  }),
  user: one(user, {
    fields: [trainingNotes.userId],
    references: [user.id],
  }),
}));
