import {
  activities,
  activityMaps,
  activityRouteHeatmapContributions,
  db,
} from "@korex/db";
import { and, count, eq, gte, lte } from "drizzle-orm";
import type { ActivityMapInput } from "../activities.types";
import type { ActivityRouteHeatmapContributionInput } from "./activity-route-heatmap";

type ActivityDatabase = Pick<
  typeof db,
  "delete" | "insert" | "select" | "transaction" | "update"
>;

export type ActivityRouteHeatmapCalculationInputs = {
  activityId: number;
  activityStartAt: Date;
  coordinates: ActivityMapInput["coordinates"];
  qualifies: boolean;
  userId: string;
};

export type ActivityRouteHeatmapCell = {
  activityCount: number;
  cellX: number;
  cellY: number;
  tileX: number;
  tileY: number;
};

export async function getActivityRouteHeatmapCalculationInputs({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityDatabase;
}): Promise<ActivityRouteHeatmapCalculationInputs | null> {
  const [row] = await database
    .select({
      activityId: activities.id,
      activityStartAt: activities.startAt,
      coordinates: activityMaps.coordinates,
      mapId: activityMaps.id,
      sportType: activities.sportType,
      userId: activities.userId,
    })
    .from(activities)
    .leftJoin(activityMaps, eq(activityMaps.activityId, activities.id))
    .where(eq(activities.id, activityId));

  if (!row) {
    return null;
  }

  return {
    activityId: row.activityId,
    activityStartAt: row.activityStartAt,
    coordinates: row.coordinates ?? [],
    qualifies: row.sportType === "run" && row.mapId !== null,
    userId: row.userId,
  };
}

export async function replaceActivityRouteHeatmapContributions({
  activityId,
  activityStartAt,
  contributions,
  database = db,
  userId,
}: {
  activityId: number;
  activityStartAt: Date;
  contributions: ActivityRouteHeatmapContributionInput[];
  database?: ActivityDatabase;
  userId: string;
}) {
  await database
    .delete(activityRouteHeatmapContributions)
    .where(eq(activityRouteHeatmapContributions.activityId, activityId));

  if (contributions.length === 0) {
    return;
  }

  await database.insert(activityRouteHeatmapContributions).values(
    contributions.map((contribution) => ({
      activityId,
      activityStartAt,
      cellX: contribution.cellX,
      cellY: contribution.cellY,
      tileX: contribution.tileX,
      tileY: contribution.tileY,
      userId,
      zoom: contribution.zoom,
    })),
  );
}

export async function clearActivityRouteHeatmapContributions({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityDatabase;
}) {
  await database
    .delete(activityRouteHeatmapContributions)
    .where(eq(activityRouteHeatmapContributions.activityId, activityId));
}

export async function listActivityRouteHeatmapCellsForViewport({
  maxTileX,
  maxTileY,
  minTileX,
  minTileY,
  userId,
  zoom,
}: {
  maxTileX: number;
  maxTileY: number;
  minTileX: number;
  minTileY: number;
  userId: string;
  zoom: number;
}): Promise<ActivityRouteHeatmapCell[]> {
  const rows = await db
    .select({
      activityCount: count(),
      cellX: activityRouteHeatmapContributions.cellX,
      cellY: activityRouteHeatmapContributions.cellY,
      tileX: activityRouteHeatmapContributions.tileX,
      tileY: activityRouteHeatmapContributions.tileY,
    })
    .from(activityRouteHeatmapContributions)
    .where(
      and(
        eq(activityRouteHeatmapContributions.userId, userId),
        eq(activityRouteHeatmapContributions.zoom, zoom),
        gte(activityRouteHeatmapContributions.tileX, minTileX),
        lte(activityRouteHeatmapContributions.tileX, maxTileX),
        gte(activityRouteHeatmapContributions.tileY, minTileY),
        lte(activityRouteHeatmapContributions.tileY, maxTileY),
      ),
    )
    .groupBy(
      activityRouteHeatmapContributions.tileX,
      activityRouteHeatmapContributions.tileY,
      activityRouteHeatmapContributions.cellX,
      activityRouteHeatmapContributions.cellY,
    );

  return rows.map((row) => ({
    activityCount: row.activityCount,
    cellX: row.cellX,
    cellY: row.cellY,
    tileX: row.tileX,
    tileY: row.tileY,
  }));
}
