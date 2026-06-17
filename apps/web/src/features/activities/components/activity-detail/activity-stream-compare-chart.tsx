import type { ActivityStreamsChartData } from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@korex/ui/components/chart";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { XAxisIcon } from "./activity-stream-chart";
import {
  buildCompareChartData,
  type ChartMetric,
  type CompareChartPoint,
  formatTooltipXAxis,
  formatXAxisValue,
  metricSpecs,
  type XAxisMode,
} from "./activity-stream-chart-utils";

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
  const chartConfig = useMemo(
    () =>
      Object.fromEntries(
        activeSelectedMetrics.map((metric) => [
          metric,
          {
            color: metricSpecs[metric].color,
            label: metricSpecs[metric].label,
          },
        ]),
      ) satisfies ChartConfig,
    [activeSelectedMetrics],
  );

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
    <div className="md:rounded-lg md:border md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
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

      <ChartContainer
        className="aspect-auto h-72 w-full md:h-80"
        config={chartConfig}
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ bottom: 8, left: -12, right: 0, top: 12 }}
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
          <YAxis axisLine={false} tickLine={false} tickMargin={8} width={40} />
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

export { ActivityStreamCompareChart };
