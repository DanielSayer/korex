import type { LatLngBounds } from "leaflet";

export type RouteHeatmapViewport = {
  bounds: LatLngBounds;
  zoom: number;
};

export type RouteHeatmapInput = {
  maxTileX: number;
  maxTileY: number;
  minTileX: number;
  minTileY: number;
  zoom: number;
};

export type RouteHeatmapCell = {
  activityCount: number;
  cellX: number;
  cellY: number;
  tileX: number;
  tileY: number;
};

export type RouteHeatmapSegment = {
  activityCount: number;
  key: string;
  positions: [[number, number], [number, number]];
};
