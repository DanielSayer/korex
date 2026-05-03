import { sql } from "drizzle-orm";
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

import { user } from "./auth";

export const heartRateZones = pgTable(
  "heart_rate_zones",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    minBpm: integer("min_bpm").notNull(),
    maxBpm: integer("max_bpm"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("heart_rate_zones_user_position_idx").on(
      table.userId,
      table.position,
    ),
    index("heart_rate_zones_user_id_idx").on(table.userId),
    check("heart_rate_zones_position_positive", sql`${table.position} > 0`),
    check("heart_rate_zones_min_bpm_non_negative", sql`${table.minBpm} >= 0`),
    check(
      "heart_rate_zones_max_bpm_greater_than_min",
      sql`${table.maxBpm} is null or ${table.maxBpm} > ${table.minBpm}`,
    ),
  ],
);
