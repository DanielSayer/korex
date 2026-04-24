import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const externalProvider = pgEnum("external_provider", ["intervals_icu"]);

export const syncRunStatus = pgEnum("sync_run_status", [
  "pending",
  "running",
  "success",
  "failed",
  "partial",
]);

export const syncType = pgEnum("sync_type", [
  "initial",
  "incremental",
  "manual",
  "backfill",
]);

export const providerConnectionStatus = pgEnum("provider_connection_status", [
  "active",
  "disconnected",
  "expired",
  "error",
]);

export const providerAuthType = pgEnum("provider_auth_type", [
  "basic",
  "oauth",
]);

export const providerConnections = pgTable(
  "provider_connections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: externalProvider("provider").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    providerUserName: text("provider_user_name"),
    status: providerConnectionStatus("status").notNull(),
    authType: providerAuthType("auth_type").notNull(),
    authUsername: text("auth_username").notNull(),
    authSecretEncrypted: text("auth_secret_encrypted").notNull(),
    authExpiresAt: timestamp("auth_expires_at"),
    scopes: jsonb("scopes"),
    metadata: jsonb("metadata"),
    lastSyncCursor: jsonb("last_sync_cursor"),
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    disconnectedAt: timestamp("disconnected_at"),
  },
  (table) => [
    uniqueIndex("provider_connections_user_provider_user_id_idx").on(
      table.userId,
      table.provider,
      table.providerUserId,
    ),
    index("provider_connections_user_id_idx").on(table.userId),
    index("provider_connections_user_provider_idx").on(
      table.userId,
      table.provider,
    ),
    index("provider_connections_status_idx").on(table.status),
  ],
);

export const syncRuns = pgTable(
  "sync_runs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: externalProvider("provider").notNull(),
    status: syncRunStatus("status").notNull(),
    syncType: syncType("sync_type").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
    cursorBefore: jsonb("cursor_before"),
    cursorAfter: jsonb("cursor_after"),
    activitiesSeen: integer("activities_seen").default(0).notNull(),
    activitiesCreated: integer("activities_created").default(0).notNull(),
    activitiesUpdated: integer("activities_updated").default(0).notNull(),
    activitiesDeleted: integer("activities_deleted").default(0).notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("sync_runs_user_id_idx").on(table.userId),
    index("sync_runs_user_provider_idx").on(table.userId, table.provider),
    index("sync_runs_status_idx").on(table.status),
    index("sync_runs_started_at_idx").on(table.startedAt),
  ],
);

export const externalActivities = pgTable(
  "external_activities",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: externalProvider("provider").notNull(),
    providerActivityId: text("provider_activity_id").notNull(),
    providerAthleteId: text("provider_athlete_id"),
    activityStartAt: timestamp("activity_start_at").notNull(),
    activityEndAt: timestamp("activity_end_at"),
    providerUpdatedAt: timestamp("provider_updated_at"),
    sportType: text("sport_type"),
    sourceType: text("source_type"),
    rawData: jsonb("raw_data").notNull(),
    normalizedData: jsonb("normalized_data"),
    payloadHash: text("payload_hash"),
    firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    lastSyncRunId: text("last_sync_run_id").references(() => syncRuns.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("external_activities_user_provider_activity_id_idx").on(
      table.userId,
      table.provider,
      table.providerActivityId,
    ),
    index("external_activities_user_activity_start_at_idx").on(
      table.userId,
      table.activityStartAt,
    ),
    index("external_activities_user_provider_idx").on(
      table.userId,
      table.provider,
    ),
    index("external_activities_provider_athlete_id_idx").on(
      table.provider,
      table.providerAthleteId,
    ),
    index("external_activities_last_sync_run_id_idx").on(table.lastSyncRunId),
    index("external_activities_deleted_at_idx").on(table.deletedAt),
  ],
);

export const syncRunsRelations = relations(syncRuns, ({ many, one }) => ({
  user: one(user, {
    fields: [syncRuns.userId],
    references: [user.id],
  }),
  externalActivities: many(externalActivities),
}));

export const providerConnectionsRelations = relations(
  providerConnections,
  ({ one }) => ({
    user: one(user, {
      fields: [providerConnections.userId],
      references: [user.id],
    }),
  }),
);

export const externalActivitiesRelations = relations(
  externalActivities,
  ({ one }) => ({
    user: one(user, {
      fields: [externalActivities.userId],
      references: [user.id],
    }),
    lastSyncRun: one(syncRuns, {
      fields: [externalActivities.lastSyncRunId],
      references: [syncRuns.id],
    }),
  }),
);
