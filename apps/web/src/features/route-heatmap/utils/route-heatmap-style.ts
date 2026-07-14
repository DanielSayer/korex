import {
  activityRouteHeatmapColorStops,
  getActivityRouteHeatmapColor,
} from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-color-ramp";

export function getRouteHeatmapRampCss() {
  const [firstStop, ...remainingStops] = activityRouteHeatmapColorStops;

  return [
    toTransparentCssColor(firstStop.color),
    toCssColor(getActivityRouteHeatmapColor(0.12)),
    ...remainingStops.map((stop) => toCssColor(stop.color)),
  ].join(", ");
}

function toCssColor({ b, g, r }: { b: number; g: number; r: number }) {
  return `rgb(${r}, ${g}, ${b})`;
}

function toTransparentCssColor({
  b,
  g,
  r,
}: {
  b: number;
  g: number;
  r: number;
}) {
  return `rgba(${r},${g},${b},0)`;
}
