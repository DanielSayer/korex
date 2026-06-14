import { relations, sql } from "drizzle-orm";
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

import { activities, activitySportType } from "./activities";
import { user } from "./auth";

export const equipmentType = pgEnum("equipment_type", ["shoes"]);

export const equipment = pgTable(
  "equipment",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    equipmentType: equipmentType("equipment_type").notNull(),
    startingDistanceMeters: doublePrecision("starting_distance_meters")
      .default(0)
      .notNull(),
    retirementDistanceMeters: doublePrecision("retirement_distance_meters"),
    retiredAt: timestamp("retired_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("equipment_user_id_idx").on(table.userId),
    index("equipment_user_type_idx").on(table.userId, table.equipmentType),
    index("equipment_retired_at_idx").on(table.retiredAt),
  ],
);

export const activityEquipmentUses = pgTable(
  "activity_equipment_uses",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    equipmentId: integer("equipment_id")
      .notNull()
      .references(() => equipment.id, { onDelete: "cascade" }),
    equipmentType: equipmentType("equipment_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("activity_equipment_uses_activity_type_idx").on(
      table.activityId,
      table.equipmentType,
    ),
    uniqueIndex("activity_equipment_uses_activity_equipment_idx").on(
      table.activityId,
      table.equipmentId,
    ),
    index("activity_equipment_uses_user_id_idx").on(table.userId),
    index("activity_equipment_uses_equipment_id_idx").on(table.equipmentId),
  ],
);

export const defaultEquipment = pgTable(
  "default_equipment",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    equipmentId: integer("equipment_id")
      .notNull()
      .references(() => equipment.id, { onDelete: "cascade" }),
    equipmentType: equipmentType("equipment_type").notNull(),
    sportType: activitySportType("sport_type").notNull(),
    clearedAt: timestamp("cleared_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("default_equipment_active_user_type_sport_idx")
      .on(table.userId, table.equipmentType, table.sportType)
      .where(sql`${table.clearedAt} is null`),
    index("default_equipment_user_id_idx").on(table.userId),
    index("default_equipment_equipment_id_idx").on(table.equipmentId),
  ],
);

export const equipmentRelations = relations(equipment, ({ many, one }) => ({
  activityUses: many(activityEquipmentUses),
  defaultEquipment: many(defaultEquipment),
  user: one(user, {
    fields: [equipment.userId],
    references: [user.id],
  }),
}));

export const activityEquipmentUsesRelations = relations(
  activityEquipmentUses,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityEquipmentUses.activityId],
      references: [activities.id],
    }),
    equipment: one(equipment, {
      fields: [activityEquipmentUses.equipmentId],
      references: [equipment.id],
    }),
    user: one(user, {
      fields: [activityEquipmentUses.userId],
      references: [user.id],
    }),
  }),
);

export const defaultEquipmentRelations = relations(
  defaultEquipment,
  ({ one }) => ({
    equipment: one(equipment, {
      fields: [defaultEquipment.equipmentId],
      references: [equipment.id],
    }),
    user: one(user, {
      fields: [defaultEquipment.userId],
      references: [user.id],
    }),
  }),
);
