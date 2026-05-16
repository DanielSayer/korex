import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  jsonb,
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

export const activityStreamType = pgEnum("activity_stream_type", [
  "cadence",
  "distance",
  "altitude",
  "heartRate",
  "velocity",
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

export type ActivityMapCoordinateJson = {
  latitude: number;
  longitude: number;
};

export type ActivityMapBoundsJson = {
  northEast: ActivityMapCoordinateJson;
  southWest: ActivityMapCoordinateJson;
};

export const activityMaps = pgTable(
  "activity_maps",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    bounds: jsonb("bounds").$type<ActivityMapBoundsJson | null>(),
    coordinates: jsonb("coordinates")
      .$type<ActivityMapCoordinateJson[]>()
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("activity_maps_activity_id_idx").on(table.activityId),
  ],
);

export const activityRouteHeatmapContributions = pgTable(
  "activity_route_heatmap_contributions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    activityStartAt: timestamp("activity_start_at").notNull(),
    zoom: integer("zoom").notNull(),
    tileX: integer("tile_x").notNull(),
    tileY: integer("tile_y").notNull(),
    cellX: integer("cell_x").notNull(),
    cellY: integer("cell_y").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("activity_route_heatmap_activity_cell_idx").on(
      table.activityId,
      table.zoom,
      table.tileX,
      table.tileY,
      table.cellX,
      table.cellY,
    ),
    index("activity_route_heatmap_user_viewport_idx").on(
      table.userId,
      table.zoom,
      table.tileX,
      table.tileY,
    ),
    index("activity_route_heatmap_user_start_at_idx").on(
      table.userId,
      table.activityStartAt,
    ),
    index("activity_route_heatmap_activity_id_idx").on(table.activityId),
  ],
);

export const activityStreams = pgTable(
  "activity_streams",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    streamType: activityStreamType("stream_type").notNull(),
    data: jsonb("data").$type<number[]>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("activity_streams_activity_type_idx").on(
      table.activityId,
      table.streamType,
    ),
    index("activity_streams_activity_id_idx").on(table.activityId),
  ],
);

export const activityHeartRateZoneSnapshots = pgTable(
  "activity_heart_rate_zone_snapshots",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
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
    uniqueIndex("activity_hr_zone_snapshots_activity_position_idx").on(
      table.activityId,
      table.position,
    ),
    index("activity_hr_zone_snapshots_activity_id_idx").on(table.activityId),
  ],
);

export const activityHeartRateZoneTimes = pgTable(
  "activity_heart_rate_zone_times",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    timeSeconds: integer("time_seconds").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("activity_hr_zone_times_activity_position_idx").on(
      table.activityId,
      table.position,
    ),
    index("activity_hr_zone_times_activity_id_idx").on(table.activityId),
  ],
);

export const activitiesRelations = relations(activities, ({ many, one }) => ({
  heartRateZoneSnapshots: many(activityHeartRateZoneSnapshots),
  heartRateZoneTimes: many(activityHeartRateZoneTimes),
  heatmapContributions: many(activityRouteHeatmapContributions),
  laps: many(activityLaps),
  map: one(activityMaps),
  streams: many(activityStreams),
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

export const activityMapsRelations = relations(activityMaps, ({ one }) => ({
  activity: one(activities, {
    fields: [activityMaps.activityId],
    references: [activities.id],
  }),
}));

export const activityRouteHeatmapContributionsRelations = relations(
  activityRouteHeatmapContributions,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityRouteHeatmapContributions.activityId],
      references: [activities.id],
    }),
    user: one(user, {
      fields: [activityRouteHeatmapContributions.userId],
      references: [user.id],
    }),
  }),
);

export const activityStreamsRelations = relations(
  activityStreams,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityStreams.activityId],
      references: [activities.id],
    }),
  }),
);

export const activityHeartRateZoneSnapshotsRelations = relations(
  activityHeartRateZoneSnapshots,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityHeartRateZoneSnapshots.activityId],
      references: [activities.id],
    }),
  }),
);

export const activityHeartRateZoneTimesRelations = relations(
  activityHeartRateZoneTimes,
  ({ one }) => ({
    activity: one(activities, {
      fields: [activityHeartRateZoneTimes.activityId],
      references: [activities.id],
    }),
  }),
);
