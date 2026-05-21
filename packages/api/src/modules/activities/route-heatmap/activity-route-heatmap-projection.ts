export type ActivityRouteHeatmapCellCoordinate = {
  cellX: number;
  cellY: number;
  tileX: number;
  tileY: number;
  zoom: number;
};

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

  return [...deltas.values()].filter((contribution) => contribution.delta !== 0);
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
