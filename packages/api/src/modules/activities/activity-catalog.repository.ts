import { activities, activityMaps, db } from "@korex/db";
import { desc, eq } from "drizzle-orm";
import type { RecentActivity } from "./activities.types";

export async function getRecentActivities({
  userId,
}: {
  userId: string;
}): Promise<RecentActivity[]> {
  const rows = await db
    .select({
      activityId: activities.id,
      averageHeartRateBeatsPerMinute: activities.averageHeartRateBeatsPerMinute,
      bounds: activityMaps.bounds,
      coordinates: activityMaps.coordinates,
      distanceMeters: activities.distanceMeters,
      durationSeconds: activities.movingTimeSeconds,
      mapId: activityMaps.id,
      name: activities.name,
      startAt: activities.startAt,
    })
    .from(activities)
    .leftJoin(activityMaps, eq(activityMaps.activityId, activities.id))
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.startAt))
    .limit(5);

  return rows.map((row) => ({
    averageHeartRateBeatsPerMinute: row.averageHeartRateBeatsPerMinute,
    distanceMeters: row.distanceMeters,
    durationSeconds: row.durationSeconds,
    id: row.activityId,
    map: row.mapId
      ? {
          bounds: row.bounds,
          coordinates: row.coordinates ?? [],
        }
      : null,
    name: row.name,
    startAt: row.startAt,
  }));
}
