type ActivityRouteHeatmapColor = {
  b: number;
  g: number;
  r: number;
};

export const activityRouteHeatmapColorStops = [
  { color: { b: 18, g: 55, r: 190 }, intensity: 0 },
  { color: { b: 0, g: 132, r: 249 }, intensity: 0.35 },
  { color: { b: 21, g: 204, r: 250 }, intensity: 0.7 },
  { color: { b: 232, g: 248, r: 255 }, intensity: 1 },
] as const satisfies readonly {
  color: ActivityRouteHeatmapColor;
  intensity: number;
}[];

export function getActivityRouteHeatmapColor(intensity: number) {
  const clamped = clamp(intensity, 0, 1);
  const [firstStop, ...remainingStops] = activityRouteHeatmapColorStops;
  let from: (typeof activityRouteHeatmapColorStops)[number] = firstStop;

  for (const to of remainingStops) {
    if (clamped <= to.intensity) {
      return interpolateRgb(
        from.color,
        to.color,
        (clamped - from.intensity) / (to.intensity - from.intensity),
      );
    }

    from = to;
  }

  return from.color;
}

function interpolateRgb(
  from: ActivityRouteHeatmapColor,
  to: ActivityRouteHeatmapColor,
  amount: number,
) {
  const t = clamp(amount, 0, 1);

  return {
    b: Math.round(from.b + (to.b - from.b) * t),
    g: Math.round(from.g + (to.g - from.g) * t),
    r: Math.round(from.r + (to.r - from.r) * t),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
