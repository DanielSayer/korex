import type {
  ActivityDetailSummary,
  ActivityStreamChartPoint,
  ActivityStreamsChartData,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@korex/ui/components/chart";
import {
  ActivityIcon,
  FootprintsIcon,
  GaugeIcon,
  HeartPulseIcon,
  MountainIcon,
  RouteIcon,
  TimerIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { formatDurationClock, formatPaceFromSpeed } from "@/utils/formatters";

type ActivityStreamChartsProps = {
  streams: ActivityStreamsChartData;
  summary: ActivityDetailSummary;
};

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
    color: "var(--chart-5)",
    formatAxisValue: (value: number) => `${Math.round(value)} m`,
    formatTooltipValue: (value: number) => `${Math.round(value)} m`,
    icon: MountainIcon,
    label: "Elevation",
  },
  cadence: {
    color: "var(--chart-2)",
    formatAxisValue: (value: number) => Math.round(value).toString(),
    formatTooltipValue: (value: number) => `${Math.round(value)} spm`,
    icon: FootprintsIcon,
    label: "Cadence",
  },
  heartRate: {
    color: "var(--chart-3)",
    formatAxisValue: (value: number) => Math.round(value).toString(),
    formatTooltipValue: (value: number) => `${Math.round(value)} bpm`,
    icon: HeartPulseIcon,
    label: "Heart Rate",
  },
  velocity: {
    color: "var(--chart-4)",
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

function ActivityStreamCharts({ streams, summary }: ActivityStreamChartsProps) {
  const [xAxisMode, setXAxisMode] = useState<XAxisMode>("time");
  const hasDistanceAxis = visibleMetrics.some((metric) =>
    streams[metric].some((point) => point.distanceMeters !== null),
  );
  const availableMetrics = visibleMetrics.filter(
    (metric) => streams[metric].length > 0,
  );
  const hasStreamData = availableMetrics.length > 0;

  if (!hasStreamData) {
    return null;
  }

  const activeXAxisMode = hasDistanceAxis ? xAxisMode : "time";

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-3xl">
            <ActivityIcon className="size-6" />
            Activity Streams
          </h2>
        </div>
        {hasDistanceAxis ? (
          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
              onClick={() => setXAxisMode("time")}
              size="sm"
              type="button"
              variant={activeXAxisMode === "time" ? "default" : "ghost"}
            >
              Time
            </Button>
            <Button
              onClick={() => setXAxisMode("distance")}
              size="sm"
              type="button"
              variant={activeXAxisMode === "distance" ? "default" : "ghost"}
            >
              Distance
            </Button>
          </div>
        ) : null}
      </div>

      <ActivityStreamCompareChart
        availableMetrics={availableMetrics}
        streams={streams}
        xAxisMode={activeXAxisMode}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ActivityStreamChart
          averageValue={summary.activity.averageHeartRateBeatsPerMinute}
          metric="heartRate"
          referenceLabel="Avg"
          series={streams.heartRate}
          xAxisMode={activeXAxisMode}
        />
        <ActivityStreamChart
          averageValue={summary.activity.averageCadenceStepsPerMinute}
          metric="cadence"
          referenceLabel="Avg"
          series={streams.cadence}
          xAxisMode={activeXAxisMode}
        />
        <ActivityStreamChart
          averageValue={summary.activity.averageSpeedMetersPerSecond}
          metric="velocity"
          referenceLabel="Avg"
          series={streams.velocity}
          xAxisMode={activeXAxisMode}
        />
        <ActivityStreamChart
          metric="altitude"
          series={streams.altitude}
          xAxisMode={activeXAxisMode}
        />
      </div>
    </section>
  );
}

function ActivityStreamCompareChart({
  availableMetrics,
  streams,
  xAxisMode,
}: {
  availableMetrics: ChartMetric[];
  streams: ActivityStreamsChartData;
  xAxisMode: XAxisMode;
}) {
  const defaultSelectedMetrics = availableMetrics.slice(0, 2);
  const [selectedMetrics, setSelectedMetrics] = useState<ChartMetric[]>(
    defaultSelectedMetrics,
  );
  const activeSelectedMetrics = selectedMetrics.filter((metric) =>
    availableMetrics.includes(metric),
  );
  const chartData = useMemo(
    () => buildCompareChartData(streams, activeSelectedMetrics, xAxisMode),
    [activeSelectedMetrics, streams, xAxisMode],
  );
  const chartConfig = Object.fromEntries(
    activeSelectedMetrics.map((metric) => [
      metric,
      {
        color: metricSpecs[metric].color,
        label: metricSpecs[metric].label,
      },
    ]),
  ) satisfies ChartConfig;

  if (availableMetrics.length < 2 || activeSelectedMetrics.length === 0) {
    return null;
  }

  function toggleMetric(metric: ChartMetric) {
    setSelectedMetrics((previous) => {
      if (previous.includes(metric)) {
        if (previous.length === 1) {
          return previous;
        }

        return previous.filter((current) => current !== metric);
      }

      return [...previous, metric];
    });
  }

  return (
    <div className="rounded-lg border p-3 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="font-medium text-base">Compare Streams</h3>
          <p className="text-muted-foreground text-sm">
            Relative scale, normalized per stream.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {availableMetrics.map((metric) => (
            <Button
              key={metric}
              onClick={() => toggleMetric(metric)}
              size="sm"
              type="button"
              variant={
                activeSelectedMetrics.includes(metric) ? "default" : "outline"
              }
            >
              {metricSpecs[metric].label}
            </Button>
          ))}
        </div>
      </div>

      <ChartContainer className="aspect-auto h-80 w-full" config={chartConfig}>
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ bottom: 8, left: 4, right: 4, top: 12 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 6" />
          <XAxis
            axisLine={false}
            dataKey="xValue"
            minTickGap={24}
            tickFormatter={(value) =>
              formatXAxisValue(Number(value), xAxisMode)
            }
            tickLine={false}
            tickMargin={8}
          />
          <YAxis axisLine={false} tickLine={false} tickMargin={8} width={56} />
          <ChartTooltip
            content={
              <ActivityStreamCompareTooltip
                selectedMetrics={activeSelectedMetrics}
                xAxisMode={xAxisMode}
              />
            }
            cursor={{ stroke: "var(--muted-foreground)" }}
          />
          {activeSelectedMetrics.map((metric) => (
            <Line
              connectNulls
              dataKey={metric}
              dot={false}
              key={metric}
              stroke={`var(--color-${metric})`}
              strokeWidth={2}
              type="monotone"
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function ActivityStreamChart({
  averageValue,
  metric,
  referenceLabel,
  series,
  xAxisMode,
}: {
  averageValue?: number | null;
  metric: ChartMetric;
  referenceLabel?: string;
  series: ActivityStreamChartPoint[];
  xAxisMode: XAxisMode;
}) {
  if (series.length === 0) {
    return null;
  }

  const spec = metricSpecs[metric];
  const Icon = spec.icon;
  const chartConfig = {
    value: {
      color: spec.color,
      label: spec.label,
    },
  } satisfies ChartConfig;
  const chartData = series.map((point) => toStreamChartPoint(point, xAxisMode));
  const gradientId = `${metric}StreamFill`;

  return (
    <div className="rounded-lg border p-3 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 font-medium text-base">
            <Icon className="size-4 text-muted-foreground" />
            {spec.label}
          </h3>
          {averageValue ? (
            <p className="text-muted-foreground text-sm">
              {referenceLabel}: {spec.formatTooltipValue(averageValue)}
            </p>
          ) : null}
        </div>
      </div>

      <ChartContainer className="aspect-auto h-72 w-full" config={chartConfig}>
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ bottom: 8, left: 4, right: 4, top: 12 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-value)"
                stopOpacity={0.72}
              />
              <stop
                offset="95%"
                stopColor="var(--color-value)"
                stopOpacity={0.08}
              />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 6" />
          <XAxis
            axisLine={false}
            dataKey="xValue"
            minTickGap={24}
            tickFormatter={(value) =>
              formatXAxisValue(Number(value), xAxisMode)
            }
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            axisLine={false}
            domain={getYAxisDomain(metric)}
            tickFormatter={(value) => spec.formatAxisValue(Number(value))}
            tickLine={false}
            tickMargin={8}
            width={metric === "velocity" ? 64 : 48}
          />
          <ChartTooltip
            content={
              <ActivityStreamTooltip metric={metric} xAxisMode={xAxisMode} />
            }
            cursor={{ stroke: "var(--muted-foreground)" }}
          />
          {averageValue ? (
            <ReferenceLine
              stroke="var(--color-value)"
              strokeDasharray="5 5"
              y={averageValue}
            >
              <Label
                offset={8}
                position="left"
                value={spec.formatAxisValue(averageValue)}
              />
            </ReferenceLine>
          ) : null}
          <Area
            dataKey="value"
            fill={`url(#${gradientId})`}
            fillOpacity={0.4}
            stroke="var(--color-value)"
            strokeWidth={2}
            type="natural"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function ActivityStreamTooltip({
  active,
  metric,
  payload,
  xAxisMode,
}: {
  active?: boolean;
  metric: ChartMetric;
  payload?: Array<{ payload: StreamChartPoint }>;
  xAxisMode: XAxisMode;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  const spec = metricSpecs[metric];
  const Icon = spec.icon;

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm shadow-xl">
      <p className="font-medium">{spec.label}</p>
      <div className="mt-1 flex flex-col gap-1 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Icon className="size-3.5" />
          {spec.formatTooltipValue(point.value)}
        </span>
        <span className="flex items-center gap-1.5">
          <XAxisIcon xAxisMode={xAxisMode} />
          {formatTooltipXAxis(point, xAxisMode)}
        </span>
      </div>
    </div>
  );
}

function ActivityStreamCompareTooltip({
  active,
  payload,
  selectedMetrics,
  xAxisMode,
}: {
  active?: boolean;
  payload?: Array<{ payload: CompareChartPoint }>;
  selectedMetrics: ChartMetric[];
  xAxisMode: XAxisMode;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  const metricRows = selectedMetrics
    .map((metric) => {
      const value = point[metric];
      const rawValue = point[`${metric}Raw`];

      if (typeof value !== "number" || typeof rawValue !== "number") {
        return null;
      }

      return {
        metric,
        value: metricSpecs[metric].formatTooltipValue(rawValue),
      };
    })
    .filter(
      (
        row,
      ): row is {
        metric: ChartMetric;
        value: string;
      } => row !== null,
    );

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm shadow-xl">
      <p className="flex items-center gap-1.5 font-medium">
        <XAxisIcon xAxisMode={xAxisMode} />
        {formatTooltipXAxis(point, xAxisMode)}
      </p>
      <div className="mt-1 flex flex-col gap-1 text-muted-foreground">
        {metricRows.map((row) => (
          <span
            className="flex items-center justify-between gap-4"
            key={row.metric}
          >
            <span>{metricSpecs[row.metric].label}</span>
            <span className="font-medium text-foreground">{row.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function XAxisIcon({ xAxisMode }: { xAxisMode: XAxisMode }) {
  return xAxisMode === "distance" ? (
    <RouteIcon className="size-3.5" />
  ) : (
    <TimerIcon className="size-3.5" />
  );
}

function buildCompareChartData(
  streams: ActivityStreamsChartData,
  selectedMetrics: ChartMetric[],
  xAxisMode: XAxisMode,
): CompareChartPoint[] {
  return selectedMetrics
    .flatMap((metric) => {
      const sampledPoints = sampleChartPoints(
        streams[metric],
        maxComparePointsPerMetric,
      );
      const valueRange = getValueRange(sampledPoints);

      return sampledPoints.map((point) => ({
        ...toStreamChartPoint(point, xAxisMode),
        [metric]: normalizeValue(point.value, valueRange),
        [`${metric}Raw`]: point.value,
      }));
    })
    .sort((left, right) => left.xValue - right.xValue);
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

export { ActivityStreamCharts };
