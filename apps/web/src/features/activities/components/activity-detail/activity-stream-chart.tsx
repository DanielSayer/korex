import type { ActivityStreamChartPoint } from "@korex/api/modules/activities/activities.types";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@korex/ui/components/chart";
import { RouteIcon, TimerIcon } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartMetric,
  formatTooltipXAxis,
  formatXAxisValue,
  getYAxisDomain,
  metricSpecs,
  type StreamChartPoint,
  toStreamChartPoint,
  type XAxisMode,
} from "./activity-stream-chart-utils";

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
  const spec = metricSpecs[metric];
  const chartConfig = useMemo(
    () =>
      ({
        value: {
          color: spec.color,
          label: spec.label,
        },
      }) satisfies ChartConfig,
    [spec.color, spec.label],
  );

  const chartData = useMemo(
    () => series.map((point) => toStreamChartPoint(point, xAxisMode)),
    [series, xAxisMode],
  );

  if (series.length === 0) {
    return null;
  }

  const Icon = spec.icon;
  const gradientId = `${metric}StreamFill`;

  return (
    <div className="border-border border-t pt-4 first:border-t-0 first:pt-0 md:rounded-lg md:border md:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-2 font-medium text-base">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{spec.label}</span>
        </h3>
        {averageValue ? (
          <p className="shrink-0 text-muted-foreground text-sm">
            {referenceLabel}: {spec.formatTooltipValue(averageValue)}
          </p>
        ) : null}
      </div>

      <ChartContainer
        className="aspect-auto h-64 w-full md:h-72"
        config={chartConfig}
      >
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ bottom: 8, left: -12, right: 0, top: 12 }}
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
            width={metric === "velocity" ? 48 : 36}
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

function XAxisIcon({ xAxisMode }: { xAxisMode: XAxisMode }) {
  return xAxisMode === "distance" ? (
    <RouteIcon className="size-3.5" />
  ) : (
    <TimerIcon className="size-3.5" />
  );
}

export { ActivityStreamChart, XAxisIcon };
