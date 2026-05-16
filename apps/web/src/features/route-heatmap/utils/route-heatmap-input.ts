import {
  routeHeatmapMaxMaterializedZoom,
  routeHeatmapMaxViewportTiles,
  routeHeatmapMinMaterializedZoom,
  routeHeatmapTilePadding,
} from "../constants";
import type { RouteHeatmapInput, RouteHeatmapViewport } from "../types";

export function getRouteHeatmapInput({
  bounds,
  zoom,
}: RouteHeatmapViewport): RouteHeatmapInput {
  const materializedZoom = clamp(
    Math.round(zoom),
    routeHeatmapMinMaterializedZoom,
    routeHeatmapMaxMaterializedZoom,
  );
  const maxTile = 2 ** materializedZoom - 1;
  const northWest = projectLatLngToTile(
    bounds.getNorth(),
    bounds.getWest(),
    materializedZoom,
  );
  const southEast = projectLatLngToTile(
    bounds.getSouth(),
    bounds.getEast(),
    materializedZoom,
  );
  const unpaddedInput = {
    maxTileX: clamp(Math.max(northWest.tileX, southEast.tileX), 0, maxTile),
    maxTileY: clamp(Math.max(northWest.tileY, southEast.tileY), 0, maxTile),
    minTileX: clamp(Math.min(northWest.tileX, southEast.tileX), 0, maxTile),
    minTileY: clamp(Math.min(northWest.tileY, southEast.tileY), 0, maxTile),
    zoom: materializedZoom,
  };
  const paddedInput = {
    maxTileX: clamp(
      unpaddedInput.maxTileX + routeHeatmapTilePadding,
      0,
      maxTile,
    ),
    maxTileY: clamp(
      unpaddedInput.maxTileY + routeHeatmapTilePadding,
      0,
      maxTile,
    ),
    minTileX: clamp(
      unpaddedInput.minTileX - routeHeatmapTilePadding,
      0,
      maxTile,
    ),
    minTileY: clamp(
      unpaddedInput.minTileY - routeHeatmapTilePadding,
      0,
      maxTile,
    ),
    zoom: materializedZoom,
  };

  if (getRouteHeatmapTileCount(paddedInput) <= routeHeatmapMaxViewportTiles) {
    return paddedInput;
  }

  return unpaddedInput;
}

function projectLatLngToTile(
  latitude: number,
  longitude: number,
  zoom: number,
) {
  const tileCount = 2 ** zoom;
  const normalizedLongitude = ((((longitude + 180) % 360) + 360) % 360) - 180;
  const sinLatitude = Math.sin(
    (clamp(latitude, -85.05112878, 85.05112878) * Math.PI) / 180,
  );
  const x = ((normalizedLongitude + 180) / 360) * tileCount;
  const y =
    (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
    tileCount;

  return {
    tileX: Math.floor(clamp(x, 0, tileCount - Number.EPSILON)),
    tileY: Math.floor(clamp(y, 0, tileCount - Number.EPSILON)),
  };
}

function getRouteHeatmapTileCount(input: RouteHeatmapInput) {
  return (
    (input.maxTileX - input.minTileX + 1) *
    (input.maxTileY - input.minTileY + 1)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
