import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
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

export const trainingNoteTags = pgTable(
  "training_note_tags",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("training_note_tags_user_name_lower_idx").on(
      table.userId,
      sql`lower(${table.name})`,
    ),
    index("training_note_tags_user_archived_idx").on(
      table.userId,
      table.archivedAt,
    ),
  ],
);

export const trainingNoteTagAssignments = pgTable(
  "training_note_tag_assignments",
  {
    trainingNoteId: integer("training_note_id")
      .notNull()
      .references(() => trainingNotes.id, { onDelete: "cascade" }),
    trainingNoteTagId: integer("training_note_tag_id")
      .notNull()
      .references(() => trainingNoteTags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("training_note_tag_assignments_note_tag_idx").on(
      table.trainingNoteId,
      table.trainingNoteTagId,
    ),
    index("training_note_tag_assignments_tag_idx").on(table.trainingNoteTagId),
  ],
);

export const trainingNotesRelations = relations(
  trainingNotes,
  ({ many, one }) => ({
    activity: one(activities, {
      fields: [trainingNotes.activityId],
      references: [activities.id],
    }),
    tagAssignments: many(trainingNoteTagAssignments),
    user: one(user, {
      fields: [trainingNotes.userId],
      references: [user.id],
    }),
  }),
);

export const trainingNoteTagsRelations = relations(
  trainingNoteTags,
  ({ many, one }) => ({
    assignments: many(trainingNoteTagAssignments),
    user: one(user, {
      fields: [trainingNoteTags.userId],
      references: [user.id],
    }),
  }),
);

export const trainingNoteTagAssignmentsRelations = relations(
  trainingNoteTagAssignments,
  ({ one }) => ({
    note: one(trainingNotes, {
      fields: [trainingNoteTagAssignments.trainingNoteId],
      references: [trainingNotes.id],
    }),
    tag: one(trainingNoteTags, {
      fields: [trainingNoteTagAssignments.trainingNoteTagId],
      references: [trainingNoteTags.id],
    }),
  }),
);
