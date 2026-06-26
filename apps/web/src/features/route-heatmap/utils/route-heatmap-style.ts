function getRouteHeatmapRampColor(intensity: number) {
  const clamped = clamp(intensity, 0, 1);

  if (clamped < 0.35) {
    return interpolateRgb(
      { b: 18, g: 55, r: 190 },
      { b: 0, g: 132, r: 249 },
      clamped / 0.35,
    );
  }

  if (clamped < 0.7) {
    return interpolateRgb(
      { b: 0, g: 132, r: 249 },
      { b: 21, g: 204, r: 250 },
      (clamped - 0.35) / 0.35,
    );
  }

  return interpolateRgb(
    { b: 21, g: 204, r: 250 },
    { b: 232, g: 248, r: 255 },
    (clamped - 0.7) / 0.3,
  );
}

export function getRouteHeatmapRampCss() {
  return [
    "rgba(190,55,18,0)",
    getRouteHeatmapRampColor(0.12),
    getRouteHeatmapRampColor(0.35),
    getRouteHeatmapRampColor(0.7),
    getRouteHeatmapRampColor(1),
  ].join(", ");
}

function interpolateRgb(
  from: { b: number; g: number; r: number },
  to: { b: number; g: number; r: number },
  amount: number,
) {
  const t = clamp(amount, 0, 1);
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
