export const routeHeatmapDisplayModes = ["density", "visited"] as const;

export type RouteHeatmapDisplayMode = (typeof routeHeatmapDisplayModes)[number];
