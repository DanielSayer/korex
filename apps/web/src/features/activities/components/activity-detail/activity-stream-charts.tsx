import type {
  ActivityDetailSummary,
  ActivityStreamChartPoint,
  ActivityStreamsChartData,
} from "@korex/api/modules/activities/activities.types";
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
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { formatDurationClock, formatPaceFromSpeed } from "@/utils/formatters";

type ActivityStreamChartsProps = {
  streams: ActivityStreamsChartData;
  summary: ActivityDetailSummary;
};

type ChartMetric =
  | "altitude"
  | "cadence"
  | "distance"
  | "heartRate"
  | "velocity";

type StreamChartPoint = {
  second: number;
  value: number;
};

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
  distance: {
    color: "var(--chart-1)",
    formatAxisValue: (value: number) => `${(value / 1000).toFixed(1)} km`,
    formatTooltipValue: (value: number) => `${(value / 1000).toFixed(2)} km`,
    icon: RouteIcon,
    label: "Distance",
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

function ActivityStreamCharts({ streams, summary }: ActivityStreamChartsProps) {
  const hasStreamData = Object.values(streams).some(
    (series) => series.length > 0,
  );

  if (!hasStreamData) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 font-bold text-3xl">
          <ActivityIcon className="size-6" />
          Activity Streams
        </h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ActivityStreamChart
          averageValue={summary.activity.averageHeartRateBeatsPerMinute}
          metric="heartRate"
          referenceLabel="Avg"
          series={streams.heartRate}
        />
        <ActivityStreamChart
          averageValue={summary.activity.averageCadenceStepsPerMinute}
          metric="cadence"
          referenceLabel="Avg"
          series={streams.cadence}
        />
        <ActivityStreamChart
          averageValue={summary.activity.averageSpeedMetersPerSecond}
          metric="velocity"
          referenceLabel="Avg"
          series={streams.velocity}
        />
        <ActivityStreamChart metric="altitude" series={streams.altitude} />
        <ActivityStreamChart
          className="xl:col-span-2"
          metric="distance"
          series={streams.distance}
        />
      </div>
    </section>
  );
}

function ActivityStreamChart({
  averageValue,
  className,
  metric,
  referenceLabel,
  series,
}: {
  averageValue?: number | null;
  className?: string;
  metric: ChartMetric;
  referenceLabel?: string;
  series: ActivityStreamChartPoint[];
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
  const chartData = series.map((point) => ({
    second: point.second,
    value: point.value,
  }));
  const gradientId = `${metric}StreamFill`;

  return (
    <div className={`rounded-lg border p-3 sm:p-5 ${className ?? ""}`}>
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
            dataKey="second"
            minTickGap={24}
            tickFormatter={(value) => formatDurationClock(Number(value))}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            axisLine={false}
            domain={getYAxisDomain(metric)}
            tickFormatter={(value) => spec.formatAxisValue(Number(value))}
            tickLine={false}
            tickMargin={8}
            width={metric === "velocity" || metric === "distance" ? 64 : 48}
          />
          <ChartTooltip
            content={<ActivityStreamTooltip metric={metric} />}
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
            type={metric === "distance" ? "monotone" : "natural"}
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
}: {
  active?: boolean;
  metric: ChartMetric;
  payload?: Array<{ payload: StreamChartPoint }>;
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
          <TimerIcon className="size-3.5" />
          {formatDurationClock(point.second)}
        </span>
      </div>
    </div>
  );
}

function getYAxisDomain(metric: ChartMetric) {
  if (metric === "heartRate" || metric === "cadence") {
    return ([dataMin, dataMax]: readonly [number, number]) =>
      [Math.max(0, dataMin - 10), dataMax + 5] as const;
  }

  if (metric === "velocity" || metric === "distance") {
    return ([, dataMax]: readonly [number, number]) =>
      [0, dataMax * 1.05] as const;
  }

  return undefined;
}

export { ActivityStreamCharts };
