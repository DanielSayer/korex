import { routeHeatmapCellsPerTile } from "../constants";
import type { RouteHeatmapCell, RouteHeatmapSegment } from "../types";

export function buildRouteHeatmapSegments({
  cells,
  cellsPerTile,
  zoom,
}: {
  cells: RouteHeatmapCell[];
  cellsPerTile: number;
  zoom: number;
}) {
  const cellsByGlobalKey = new Map<string, RouteHeatmapCell>();
  const segments: RouteHeatmapSegment[] = [];

  for (const cell of cells) {
    cellsByGlobalKey.set(getGlobalCellKey({ cell, cellsPerTile }), cell);
  }

  for (const cell of cells) {
    const globalCell = getGlobalCellPosition({ cell, cellsPerTile });
    const neighbors = [
      [globalCell.x + 1, globalCell.y],
      [globalCell.x, globalCell.y + 1],
      [globalCell.x + 1, globalCell.y + 1],
      [globalCell.x - 1, globalCell.y + 1],
    ];

    for (const [neighborX, neighborY] of neighbors) {
      const neighbor = cellsByGlobalKey.get(`${neighborX}:${neighborY}`);

      if (!neighbor) {
        continue;
      }

      segments.push({
        activityCount: Math.max(cell.activityCount, neighbor.activityCount),
        key: `${globalCell.x}:${globalCell.y}-${neighborX}:${neighborY}`,
        positions: [
          getCellCenter({ cell, cellsPerTile, zoom }),
          getCellCenter({ cell: neighbor, cellsPerTile, zoom }),
        ],
      });
    }
  }

  return segments;
}

function getCellCenter({
  cell,
  cellsPerTile = routeHeatmapCellsPerTile,
  zoom,
}: {
  cell: Pick<RouteHeatmapCell, "cellX" | "cellY" | "tileX" | "tileY">;
  cellsPerTile?: number;
  zoom: number;
}) {
  const zoomCellCount = 2 ** zoom * cellsPerTile;
  const globalCellX = cell.tileX * cellsPerTile + cell.cellX + 0.5;
  const globalCellY = cell.tileY * cellsPerTile + cell.cellY + 0.5;
  const longitude = (globalCellX / zoomCellCount) * 360 - 180;
  const mercatorY = Math.PI * (1 - (2 * globalCellY) / zoomCellCount);
  const latitude = (Math.atan(Math.sinh(mercatorY)) * 180) / Math.PI;

  return [latitude, longitude] satisfies [number, number];
}

function getGlobalCellKey({
  cell,
  cellsPerTile,
}: {
  cell: RouteHeatmapCell;
  cellsPerTile: number;
}) {
  const globalCell = getGlobalCellPosition({ cell, cellsPerTile });

  return `${globalCell.x}:${globalCell.y}`;
}

function getGlobalCellPosition({
  cell,
  cellsPerTile,
}: {
  cell: RouteHeatmapCell;
  cellsPerTile: number;
}) {
  return {
    x: cell.tileX * cellsPerTile + cell.cellX,
    y: cell.tileY * cellsPerTile + cell.cellY,
  };
}
