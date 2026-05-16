export function getRouteHeatmapColor(
  activityCount: number,
  maxActivityCount: number,
) {
  const intensity = activityCount / maxActivityCount;

  if (intensity > 0.66) {
    return "#ef4444";
  }

  if (intensity > 0.33) {
    return "#f97316";
  }

  return "#facc15";
}

export function getRouteHeatmapGlowOpacity(
  activityCount: number,
  maxActivityCount: number,
) {
  return 0.12 + (activityCount / maxActivityCount) * 0.2;
}

export function getRouteHeatmapCoreOpacity(
  activityCount: number,
  maxActivityCount: number,
) {
  return 0.48 + (activityCount / maxActivityCount) * 0.26;
}

export function getRouteHeatmapGlowWeight(
  activityCount: number,
  maxActivityCount: number,
) {
  return 10 + (activityCount / maxActivityCount) * 10;
}

export function getRouteHeatmapCoreWeight(
  activityCount: number,
  maxActivityCount: number,
) {
  return 3 + (activityCount / maxActivityCount) * 4;
}
