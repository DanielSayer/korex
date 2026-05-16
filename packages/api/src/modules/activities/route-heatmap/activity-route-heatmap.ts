import type { ActivityMapCoordinateInput } from "../activities.types";

export const activityRouteHeatmapZoomLevels = [
  4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
] as const;

export const activityRouteHeatmapCellsPerTile = 64;

export type ActivityRouteHeatmapZoom =
  (typeof activityRouteHeatmapZoomLevels)[number];

export type ActivityRouteHeatmapContributionInput = {
  cellX: number;
  cellY: number;
  tileX: number;
  tileY: number;
  zoom: ActivityRouteHeatmapZoom;
};

export type ProjectedCellPoint = {
  x: number;
  y: number;
};

export function calculateActivityRouteHeatmapContributions({
  coordinates,
  zoomLevels = activityRouteHeatmapZoomLevels,
}: {
  coordinates: ActivityMapCoordinateInput[];
  zoomLevels?: readonly ActivityRouteHeatmapZoom[];
}): ActivityRouteHeatmapContributionInput[] {
  if (coordinates.length === 0) {
    return [];
  }

  const contributions: ActivityRouteHeatmapContributionInput[] = [];

  for (const zoom of zoomLevels) {
    const projected = coordinates.map((coordinate) =>
      projectCoordinateToGlobalCellSpace(coordinate, zoom),
    );
    const simplified = simplifyProjectedPoints(projected, 0.5);
    const cells = new Set<string>();

    if (simplified.length === 1) {
      cells.add(getCellKey(readPoint(simplified, 0)));
    }

    for (let index = 1; index < simplified.length; index += 1) {
      for (const cell of rasterizeSegment(
        readPoint(simplified, index - 1),
        readPoint(simplified, index),
      )) {
        cells.add(getCellKey(cell));
      }
    }

    for (const key of cells) {
      const globalCell = readCellKey(key);

      contributions.push(
        toContribution({
          globalCellX: globalCell.x,
          globalCellY: globalCell.y,
          zoom,
        }),
      );
    }
  }

  return contributions;
}

export function projectCoordinateToGlobalCellSpace(
  coordinate: ActivityMapCoordinateInput,
  zoom: ActivityRouteHeatmapZoom,
): ProjectedCellPoint {
  const worldCells = 2 ** zoom * activityRouteHeatmapCellsPerTile;
  const latitude = Math.max(
    -85.05112878,
    Math.min(85.05112878, coordinate.latitude),
  );
  const longitude = normalizeLongitude(coordinate.longitude);
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);
  const x = ((longitude + 180) / 360) * worldCells;
  const y =
    (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
    worldCells;

  return {
    x: clamp(Math.floor(x), 0, worldCells - 1),
    y: clamp(Math.floor(y), 0, worldCells - 1),
  };
}

export function simplifyProjectedPoints(
  points: ProjectedCellPoint[],
  tolerance: number,
): ProjectedCellPoint[] {
  if (points.length <= 2) {
    return dedupeConsecutivePoints(points);
  }

  return dedupeConsecutivePoints(
    simplifyRange(points, 0, points.length - 1, tolerance),
  );
}

function simplifyRange(
  points: ProjectedCellPoint[],
  startIndex: number,
  endIndex: number,
  tolerance: number,
): ProjectedCellPoint[] {
  let maxDistance = 0;
  let maxIndex = startIndex;

  for (let index = startIndex + 1; index < endIndex; index += 1) {
    const distance = perpendicularDistance(
      readPoint(points, index),
      readPoint(points, startIndex),
      readPoint(points, endIndex),
    );

    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = index;
    }
  }

  if (maxDistance <= tolerance) {
    return [readPoint(points, startIndex), readPoint(points, endIndex)];
  }

  const first = simplifyRange(points, startIndex, maxIndex, tolerance);
  const second = simplifyRange(points, maxIndex, endIndex, tolerance);

  return first.slice(0, -1).concat(second);
}

function dedupeConsecutivePoints(
  points: ProjectedCellPoint[],
): ProjectedCellPoint[] {
  return points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || previous.x !== point.x || previous.y !== point.y;
  });
}

export function perpendicularDistance(
  point: ProjectedCellPoint,
  lineStart: ProjectedCellPoint,
  lineEnd: ProjectedCellPoint,
) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  }

  return (
    Math.abs(
      dy * point.x -
        dx * point.y +
        lineEnd.x * lineStart.y -
        lineEnd.y * lineStart.x,
    ) / Math.hypot(dx, dy)
  );
}

export function rasterizeSegment(
  start: ProjectedCellPoint,
  end: ProjectedCellPoint,
): ProjectedCellPoint[] {
  const cells: ProjectedCellPoint[] = [];
  let x = start.x;
  let y = start.y;
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const stepX = start.x < end.x ? 1 : -1;
  const stepY = start.y < end.y ? 1 : -1;
  let error = dx - dy;

  while (true) {
    cells.push({ x, y });

    if (x === end.x && y === end.y) {
      break;
    }

    const doubledError = error * 2;

    if (doubledError > -dy) {
      error -= dy;
      x += stepX;
    }

    if (doubledError < dx) {
      error += dx;
      y += stepY;
    }
  }

  return cells;
}

export function toContribution({
  globalCellX,
  globalCellY,
  zoom,
}: {
  globalCellX: number;
  globalCellY: number;
  zoom: ActivityRouteHeatmapZoom;
}): ActivityRouteHeatmapContributionInput {
  return {
    cellX: globalCellX % activityRouteHeatmapCellsPerTile,
    cellY: globalCellY % activityRouteHeatmapCellsPerTile,
    tileX: Math.floor(globalCellX / activityRouteHeatmapCellsPerTile),
    tileY: Math.floor(globalCellY / activityRouteHeatmapCellsPerTile),
    zoom,
  };
}

export function getCellKey(point: ProjectedCellPoint) {
  return `${point.x}:${point.y}`;
}

export function readCellKey(key: string): ProjectedCellPoint {
  const [x, y] = key.split(":").map(Number);

  if (
    x === undefined ||
    y === undefined ||
    Number.isNaN(x) ||
    Number.isNaN(y)
  ) {
    throw new Error("Invalid Activity Route Heatmap cell key");
  }

  return { x, y };
}

function readPoint(points: ProjectedCellPoint[], index: number) {
  const point = points[index];

  if (!point) {
    throw new Error("Expected projected Activity Route Heatmap point");
  }

  return point;
}

function normalizeLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
