import type {
  ActivityStreamChartPoint,
  ActivityStreamsChartData,
} from "@korex/api/modules/activities/activities.types";
import {
  type ActivityIcon,
  FootprintsIcon,
  GaugeIcon,
  HeartPulseIcon,
  MountainIcon,
} from "lucide-react";
import {
  formatDurationClock,
  formatPaceFromSpeed,
} from "../../../../utils/formatters";

type ChartMetric = "altitude" | "cadence" | "heartRate" | "velocity";
type XAxisMode = "time" | "distance";

type StreamChartPoint = {
  distanceMeters: number | null;
  second: number;
  value: number;
  xValue: number;
};

type CompareChartPoint = {
  altitude?: number;
  altitudeRaw?: number;
  cadence?: number;
  cadenceRaw?: number;
  distanceMeters: number | null;
  heartRate?: number;
  heartRateRaw?: number;
  second: number;
  velocity?: number;
  velocityRaw?: number;
  xValue: number;
};

const maxComparePointsPerMetric = 240;

const metricSpecs = {
  altitude: {
    color: "color-mix(in oklch, var(--chart-5) 65%, var(--foreground))",
    formatAxisValue: (value: number) => `${Math.round(value)} m`,
    formatTooltipValue: (value: number) => `${Math.round(value)} m`,
    icon: MountainIcon,
    label: "Elevation",
  },
  cadence: {
    color: "color-mix(in oklch, var(--chart-2) 65%, var(--foreground))",
    formatAxisValue: (value: number) => Math.round(value).toString(),
    formatTooltipValue: (value: number) => `${Math.round(value)} spm`,
    icon: FootprintsIcon,
    label: "Cadence",
  },
  heartRate: {
    color: "color-mix(in oklch, var(--chart-3) 65%, var(--foreground))",
    formatAxisValue: (value: number) => Math.round(value).toString(),
    formatTooltipValue: (value: number) => `${Math.round(value)} bpm`,
    icon: HeartPulseIcon,
    label: "Heart Rate",
  },
  velocity: {
    color: "color-mix(in oklch, var(--chart-4) 65%, var(--foreground))",
    formatAxisValue: (value: number) => formatPaceFromSpeed(value),
    formatTooltipValue: (value: number) => `${formatPaceFromSpeed(value)} /km`,
    icon: GaugeIcon,
    label: "Pace",
  },
} satisfies Record<
  ChartMetric,
  {
    color: string;
    formatAxisValue: (value: number) => string;
    formatTooltipValue: (value: number) => string;
    icon: typeof ActivityIcon;
    label: string;
  }
>;

const visibleMetrics = [
  "heartRate",
  "cadence",
  "velocity",
  "altitude",
] as const satisfies ChartMetric[];

function buildCompareChartData(
  streams: ActivityStreamsChartData,
  selectedMetrics: ChartMetric[],
  xAxisMode: XAxisMode,
): CompareChartPoint[] {
  const pointsByXValue = new Map<number, CompareChartPoint>();

  for (const metric of selectedMetrics) {
    const sampledPoints = sampleChartPoints(
      streams[metric],
      maxComparePointsPerMetric,
    );
    const valueRange = getValueRange(sampledPoints);

    for (const point of sampledPoints) {
      const streamPoint = toStreamChartPoint(point, xAxisMode);
      const comparePoint = pointsByXValue.get(streamPoint.xValue) ?? {
        distanceMeters: streamPoint.distanceMeters,
        second: streamPoint.second,
        xValue: streamPoint.xValue,
      };

      comparePoint[metric] = normalizeValue(point.value, valueRange);
      comparePoint[`${metric}Raw`] = point.value;
      pointsByXValue.set(streamPoint.xValue, comparePoint);
    }
  }

  return Array.from(pointsByXValue.values()).sort(
    (left, right) => left.xValue - right.xValue,
  );
}

function sampleChartPoints<T>(points: T[], maxPoints: number) {
  if (points.length <= maxPoints) {
    return points;
  }

  const step = points.length / maxPoints;
  return Array.from({ length: maxPoints }, (_, index) => {
    const point = points[Math.floor(index * step)];
    return point ?? points.at(-1);
  }).filter((point): point is T => point !== undefined);
}

function getValueRange(points: ActivityStreamChartPoint[]) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return { max, min };
}

function normalizeValue(value: number, range: { max: number; min: number }) {
  const span = range.max - range.min;

  if (span <= 0) {
    return 50;
  }

  return ((value - range.min) / span) * 100;
}

function toStreamChartPoint(
  point: ActivityStreamChartPoint,
  xAxisMode: XAxisMode,
): StreamChartPoint {
  return {
    distanceMeters: point.distanceMeters,
    second: point.second,
    value: point.value,
    xValue:
      xAxisMode === "distance" && point.distanceMeters !== null
        ? point.distanceMeters
        : point.second,
  };
}

function getYAxisDomain(metric: ChartMetric) {
  if (metric === "heartRate" || metric === "cadence") {
    return ([dataMin, dataMax]: readonly [number, number]) =>
      [Math.max(0, dataMin - 10), dataMax + 5] as const;
  }

  if (metric === "velocity") {
    return ([, dataMax]: readonly [number, number]) =>
      [0, dataMax * 1.05] as const;
  }

  return undefined;
}

function formatXAxisValue(value: number, xAxisMode: XAxisMode) {
  if (xAxisMode === "distance") {
    return `${(value / 1000).toFixed(1)} km`;
  }

  return formatDurationClock(value);
}

function formatTooltipXAxis(
  point: Pick<StreamChartPoint, "distanceMeters" | "second">,
  xAxisMode: XAxisMode,
) {
  if (xAxisMode === "distance" && point.distanceMeters !== null) {
    return `${(point.distanceMeters / 1000).toFixed(2)} km`;
  }

  return formatDurationClock(point.second);
}

export type { ChartMetric, CompareChartPoint, StreamChartPoint, XAxisMode };
export {
  buildCompareChartData,
  formatTooltipXAxis,
  formatXAxisValue,
  getYAxisDomain,
  metricSpecs,
  normalizeValue,
  sampleChartPoints,
  toStreamChartPoint,
  visibleMetrics,
};
