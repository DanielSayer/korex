import {
  activities,
  activityMaps,
  activityRouteHeatmapCells,
  activityRouteHeatmapContributionSets,
  db,
} from "@korex/db";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { ActivityMapInput } from "../activities.types";
import type { ActivityRouteHeatmapContributionInput } from "./activity-route-heatmap";
import {
  type ActivityRouteHeatmapCellCoordinate,
  calculateActivityRouteHeatmapCellDeltas,
  packActivityRouteHeatmapContributionSets,
  unpackActivityRouteHeatmapContributionSets,
} from "./activity-route-heatmap-projection";

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
  const contributionSets =
    packActivityRouteHeatmapContributionSets(contributions);

  await database.transaction(async (tx) => {
    const existingContributionSets = await tx
      .select({
        cellKeys: activityRouteHeatmapContributionSets.cellKeys,
        zoom: activityRouteHeatmapContributionSets.zoom,
      })
      .from(activityRouteHeatmapContributionSets)
      .where(eq(activityRouteHeatmapContributionSets.activityId, activityId));

    await tx
      .delete(activityRouteHeatmapContributionSets)
      .where(eq(activityRouteHeatmapContributionSets.activityId, activityId));

    if (contributionSets.length > 0) {
      await tx.insert(activityRouteHeatmapContributionSets).values(
        contributionSets.map((contributionSet) => ({
          activityId,
          activityStartAt,
          cellKeys: contributionSet.cellKeys,
          userId,
          zoom: contributionSet.zoom,
        })),
      );
    }

    await applyActivityRouteHeatmapCellDeltas({
      contributions,
      existingContributions: unpackActivityRouteHeatmapContributionSets(
        existingContributionSets,
      ),
      tx,
      userId,
    });
  });
}

export async function clearActivityRouteHeatmapContributions({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityDatabase;
}) {
  await database.transaction(async (tx) => {
    const existingContributionSets = await tx
      .select({
        cellKeys: activityRouteHeatmapContributionSets.cellKeys,
        userId: activityRouteHeatmapContributionSets.userId,
        zoom: activityRouteHeatmapContributionSets.zoom,
      })
      .from(activityRouteHeatmapContributionSets)
      .where(eq(activityRouteHeatmapContributionSets.activityId, activityId));

    await tx
      .delete(activityRouteHeatmapContributionSets)
      .where(eq(activityRouteHeatmapContributionSets.activityId, activityId));

    const contributionsByUser = new Map<
      string,
      ActivityRouteHeatmapCellCoordinate[]
    >();

    for (const contributionSet of existingContributionSets) {
      const userContributions =
        contributionsByUser.get(contributionSet.userId) ?? [];

      userContributions.push(
        ...unpackActivityRouteHeatmapContributionSets([contributionSet]),
      );
      contributionsByUser.set(contributionSet.userId, userContributions);
    }

    for (const [userId, userContributions] of contributionsByUser) {
      await applyActivityRouteHeatmapCellDeltas({
        contributions: [],
        existingContributions: userContributions,
        tx,
        userId,
      });
    }
  });
}

export async function listActivityRouteHeatmapAggregateCellsForTile({
  tileX,
  tileY,
  userId,
  zoom,
}: {
  tileX: number;
  tileY: number;
  userId: string;
  zoom: number;
}): Promise<ActivityRouteHeatmapCell[]> {
  const maxTile = 2 ** zoom - 1;

  const rows = await db
    .select({
      activityCount: activityRouteHeatmapCells.activityCount,
      cellX: activityRouteHeatmapCells.cellX,
      cellY: activityRouteHeatmapCells.cellY,
      tileX: activityRouteHeatmapCells.tileX,
      tileY: activityRouteHeatmapCells.tileY,
    })
    .from(activityRouteHeatmapCells)
    .where(
      and(
        eq(activityRouteHeatmapCells.userId, userId),
        eq(activityRouteHeatmapCells.zoom, zoom),
        gte(activityRouteHeatmapCells.tileX, Math.max(0, tileX - 1)),
        lte(activityRouteHeatmapCells.tileX, Math.min(maxTile, tileX + 1)),
        gte(activityRouteHeatmapCells.tileY, Math.max(0, tileY - 1)),
        lte(activityRouteHeatmapCells.tileY, Math.min(maxTile, tileY + 1)),
      ),
    );

  return rows.map((row) => ({
    activityCount: row.activityCount,
    cellX: row.cellX,
    cellY: row.cellY,
    tileX: row.tileX,
    tileY: row.tileY,
  }));
}

export async function getActivityRouteHeatmapMaxActivityCount({
  userId,
  zoom,
}: {
  userId: string;
  zoom: number;
}) {
  const [row] = await db
    .select({
      activityCount: activityRouteHeatmapCells.activityCount,
    })
    .from(activityRouteHeatmapCells)
    .where(
      and(
        eq(activityRouteHeatmapCells.userId, userId),
        eq(activityRouteHeatmapCells.zoom, zoom),
      ),
    )
    .orderBy(desc(activityRouteHeatmapCells.activityCount))
    .limit(1);

  return row?.activityCount ?? 1;
}

type HeatmapCellDeltaTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

async function applyActivityRouteHeatmapCellDeltas({
  contributions,
  existingContributions,
  tx,
  userId,
}: {
  contributions: ActivityRouteHeatmapCellCoordinate[];
  existingContributions: ActivityRouteHeatmapCellCoordinate[];
  tx: HeatmapCellDeltaTransaction;
  userId: string;
}) {
  const deltas = calculateActivityRouteHeatmapCellDeltas({
    contributions,
    existingContributions,
  });

  if (deltas.length === 0) {
    return;
  }

  const serializedDeltas = JSON.stringify(
    deltas.map(({ cellX, cellY, delta, tileX, tileY, zoom }) => ({
      activity_count: delta,
      cell_x: cellX,
      cell_y: cellY,
      tile_x: tileX,
      tile_y: tileY,
      zoom,
    })),
  );

  await tx.execute(sql`
    INSERT INTO activity_route_heatmap_cells (
      user_id,
      zoom,
      tile_x,
      tile_y,
      cell_x,
      cell_y,
      activity_count,
      created_at,
      updated_at
    )
    SELECT
      ${userId},
      delta.zoom,
      delta.tile_x,
      delta.tile_y,
      delta.cell_x,
      delta.cell_y,
      delta.activity_count,
      NOW(),
      NOW()
    FROM JSONB_TO_RECORDSET(${serializedDeltas}::jsonb) AS delta(
      zoom integer,
      tile_x integer,
      tile_y integer,
      cell_x integer,
      cell_y integer,
      activity_count integer
    )
    ON CONFLICT (user_id, zoom, tile_x, tile_y, cell_x, cell_y)
    DO UPDATE SET
      activity_count = activity_route_heatmap_cells.activity_count + EXCLUDED.activity_count,
      updated_at = NOW()
  `);

  await tx
    .delete(activityRouteHeatmapCells)
    .where(
      and(
        eq(activityRouteHeatmapCells.userId, userId),
        lte(activityRouteHeatmapCells.activityCount, 0),
      ),
    );
}
