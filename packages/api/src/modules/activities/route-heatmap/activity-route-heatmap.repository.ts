import {
  activities,
  activityMaps,
  activityRouteHeatmapCells,
  activityRouteHeatmapContributions,
  db,
} from "@korex/db";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { ActivityMapInput } from "../activities.types";
import type { ActivityRouteHeatmapContributionInput } from "./activity-route-heatmap";
import {
  type ActivityRouteHeatmapCellCoordinate,
  calculateActivityRouteHeatmapCellDeltas,
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
  await database.transaction(async (tx) => {
    const existingContributions = await tx
      .select({
        cellX: activityRouteHeatmapContributions.cellX,
        cellY: activityRouteHeatmapContributions.cellY,
        tileX: activityRouteHeatmapContributions.tileX,
        tileY: activityRouteHeatmapContributions.tileY,
        zoom: activityRouteHeatmapContributions.zoom,
      })
      .from(activityRouteHeatmapContributions)
      .where(eq(activityRouteHeatmapContributions.activityId, activityId));

    await tx
      .delete(activityRouteHeatmapContributions)
      .where(eq(activityRouteHeatmapContributions.activityId, activityId));

    if (contributions.length > 0) {
      await tx.insert(activityRouteHeatmapContributions).values(
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

    await applyActivityRouteHeatmapCellDeltas({
      contributions,
      existingContributions,
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
    const existingContributions = await tx
      .select({
        cellX: activityRouteHeatmapContributions.cellX,
        cellY: activityRouteHeatmapContributions.cellY,
        tileX: activityRouteHeatmapContributions.tileX,
        tileY: activityRouteHeatmapContributions.tileY,
        userId: activityRouteHeatmapContributions.userId,
        zoom: activityRouteHeatmapContributions.zoom,
      })
      .from(activityRouteHeatmapContributions)
      .where(eq(activityRouteHeatmapContributions.activityId, activityId));

    await tx
      .delete(activityRouteHeatmapContributions)
      .where(eq(activityRouteHeatmapContributions.activityId, activityId));

    const contributionsByUser = new Map<
      string,
      ActivityRouteHeatmapCellCoordinate[]
    >();

    for (const contribution of existingContributions) {
      const userContributions =
        contributionsByUser.get(contribution.userId) ?? [];

      userContributions.push(contribution);
      contributionsByUser.set(contribution.userId, userContributions);
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

  for (const contribution of deltas) {
    if (contribution.delta > 0) {
      await tx
        .insert(activityRouteHeatmapCells)
        .values({
          activityCount: contribution.delta,
          cellX: contribution.cellX,
          cellY: contribution.cellY,
          tileX: contribution.tileX,
          tileY: contribution.tileY,
          userId,
          zoom: contribution.zoom,
        })
        .onConflictDoUpdate({
          target: [
            activityRouteHeatmapCells.userId,
            activityRouteHeatmapCells.zoom,
            activityRouteHeatmapCells.tileX,
            activityRouteHeatmapCells.tileY,
            activityRouteHeatmapCells.cellX,
            activityRouteHeatmapCells.cellY,
          ],
          set: {
            activityCount: sql`${activityRouteHeatmapCells.activityCount} + ${contribution.delta}`,
            updatedAt: new Date(),
          },
        });
      continue;
    }

    await tx
      .update(activityRouteHeatmapCells)
      .set({
        activityCount: sql`${activityRouteHeatmapCells.activityCount} + ${contribution.delta}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(activityRouteHeatmapCells.userId, userId),
          eq(activityRouteHeatmapCells.zoom, contribution.zoom),
          eq(activityRouteHeatmapCells.tileX, contribution.tileX),
          eq(activityRouteHeatmapCells.tileY, contribution.tileY),
          eq(activityRouteHeatmapCells.cellX, contribution.cellX),
          eq(activityRouteHeatmapCells.cellY, contribution.cellY),
        ),
      );
  }

  await tx
    .delete(activityRouteHeatmapCells)
    .where(lte(activityRouteHeatmapCells.activityCount, 0));
}
