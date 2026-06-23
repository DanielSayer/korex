import { activityRouteHeatmapCellsPerTile } from "./activity-route-heatmap";

export type ActivityRouteHeatmapCellCoordinate = {
  cellX: number;
  cellY: number;
  tileX: number;
  tileY: number;
  zoom: number;
};

export type ActivityRouteHeatmapContributionSet = {
  cellKeys: number[];
  zoom: number;
};

const encodedCellCoordinateBase = 2 ** 22;

export function packActivityRouteHeatmapContributionSets(
  contributions: ActivityRouteHeatmapCellCoordinate[],
): ActivityRouteHeatmapContributionSet[] {
  const keysByZoom = new Map<number, Set<number>>();

  for (const contribution of contributions) {
    const keys = keysByZoom.get(contribution.zoom) ?? new Set<number>();

    keys.add(encodeActivityRouteHeatmapCell(contribution));
    keysByZoom.set(contribution.zoom, keys);
  }

  return [...keysByZoom.entries()]
    .sort(([leftZoom], [rightZoom]) => leftZoom - rightZoom)
    .map(([zoom, keys]) => ({
      cellKeys: [...keys].sort((left, right) => left - right),
      zoom,
    }));
}

export function unpackActivityRouteHeatmapContributionSets(
  contributionSets: ActivityRouteHeatmapContributionSet[],
): ActivityRouteHeatmapCellCoordinate[] {
  return contributionSets.flatMap(({ cellKeys, zoom }) =>
    cellKeys.map((cellKey) =>
      decodeActivityRouteHeatmapCell({ cellKey, zoom }),
    ),
  );
}

export function encodeActivityRouteHeatmapCell({
  cellX,
  cellY,
  tileX,
  tileY,
}: ActivityRouteHeatmapCellCoordinate) {
  const globalCellX = tileX * activityRouteHeatmapCellsPerTile + cellX;
  const globalCellY = tileY * activityRouteHeatmapCellsPerTile + cellY;

  return globalCellX * encodedCellCoordinateBase + globalCellY;
}

export function decodeActivityRouteHeatmapCell({
  cellKey,
  zoom,
}: {
  cellKey: number;
  zoom: number;
}): ActivityRouteHeatmapCellCoordinate {
  const globalCellX = Math.floor(cellKey / encodedCellCoordinateBase);
  const globalCellY = cellKey % encodedCellCoordinateBase;

  return {
    cellX: globalCellX % activityRouteHeatmapCellsPerTile,
    cellY: globalCellY % activityRouteHeatmapCellsPerTile,
    tileX: Math.floor(globalCellX / activityRouteHeatmapCellsPerTile),
    tileY: Math.floor(globalCellY / activityRouteHeatmapCellsPerTile),
    zoom,
  };
}

export type ActivityRouteHeatmapCellDelta =
  ActivityRouteHeatmapCellCoordinate & {
    delta: number;
  };

export function calculateActivityRouteHeatmapCellDeltas({
  contributions,
  existingContributions,
}: {
  contributions: ActivityRouteHeatmapCellCoordinate[];
  existingContributions: ActivityRouteHeatmapCellCoordinate[];
}): ActivityRouteHeatmapCellDelta[] {
  const deltas = new Map<string, ActivityRouteHeatmapCellDelta>();

  for (const contribution of existingContributions) {
    addCellDelta({ contribution, delta: -1, deltas });
  }

  for (const contribution of contributions) {
    addCellDelta({ contribution, delta: 1, deltas });
  }

  return [...deltas.values()].filter(
    (contribution) => contribution.delta !== 0,
  );
}

function addCellDelta({
  contribution,
  delta,
  deltas,
}: {
  contribution: ActivityRouteHeatmapCellCoordinate;
  delta: number;
  deltas: Map<string, ActivityRouteHeatmapCellDelta>;
}) {
  const key = [
    contribution.zoom,
    contribution.tileX,
    contribution.tileY,
    contribution.cellX,
    contribution.cellY,
  ].join(":");
  const existing = deltas.get(key);

  deltas.set(key, {
    ...contribution,
    delta: (existing?.delta ?? 0) + delta,
  });
}
