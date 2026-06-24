import type {
  AnalyticsBestEfforts,
  BestEffortStandardDistanceCode,
} from "@korex/api/modules/activities/activities.types";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@korex/ui/components/chart";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { SectionLabel } from "@/components/brand";
import { formatDurationClock, formatShortMonth } from "@/utils/formatters";
import { chartAxisTick } from "../analytics-chart-utils";
import {
  getDurationAxisDomain,
  isExistingMonth,
} from "./best-effort-chart-utils";
import { bestEffortDistanceLabels } from "./best-effort-distance-options";
import { BestEffortDistancePicker } from "./best-effort-distance-picker";

function PersonalBestEffortTrendChart({
  analytics,
  availableDistanceCodes,
  onDistanceCodeChange,
  selectedDistanceCode,
  year,
}: {
  analytics: AnalyticsBestEfforts;
  availableDistanceCodes: BestEffortStandardDistanceCode[];
  onDistanceCodeChange: (distanceCode: BestEffortStandardDistanceCode) => void;
  selectedDistanceCode: BestEffortStandardDistanceCode;
  year: number;
}) {
  const chartData = useMemo(
    () =>
      analytics.monthlyTrendBuckets
        .filter(
          (bucket) =>
            bucket.standardDistanceCode === selectedDistanceCode &&
            isExistingMonth(bucket.bucketStartAt, year),
        )
        .map((bucket) => ({
          durationSeconds: bucket.durationSeconds,
          label: formatShortMonth(bucket.bucketStartAt),
        })),
    [analytics.monthlyTrendBuckets, selectedDistanceCode, year],
  );

  const yAxisDomain = getDurationAxisDomain(
    chartData.map((bucket) => bucket.durationSeconds),
  );

  const chartConfig = {
    durationSeconds: {
      color: "var(--chart-3)",
      label: `${bestEffortDistanceLabels[selectedDistanceCode]} best`,
    },
  } satisfies ChartConfig;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SectionLabel>Monthly best trend</SectionLabel>
        <BestEffortDistancePicker
          availableDistanceCodes={availableDistanceCodes}
          onDistanceCodeChange={onDistanceCodeChange}
          selectedDistanceCode={selectedDistanceCode}
        />
      </div>
      <p className="-mt-1 text-muted-foreground text-xs">
        Fastest effort by month end in {year}.
      </p>
      <ChartContainer
        className="aspect-auto h-64 w-full sm:h-80"
        config={chartConfig}
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ bottom: 8, left: 4, right: 28, top: 12 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 6" />
          <XAxis
            axisLine={false}
            dataKey="label"
            interval={0}
            minTickGap={8}
            padding={{ left: 8, right: 28 }}
            tick={chartAxisTick}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            domain={yAxisDomain}
            tick={chartAxisTick}
            tickFormatter={(value) => formatDurationClock(Number(value))}
            tickLine={false}
            width={72}
            yAxisId="duration"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <div className="flex flex-1 justify-between gap-3">
                    <span className="text-muted-foreground">
                      {bestEffortDistanceLabels[selectedDistanceCode]} best
                    </span>
                    <span className="font-medium font-mono text-foreground tabular-nums">
                      {formatDurationClock(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
            cursor={{ stroke: "var(--muted-foreground)" }}
          />
          <Line
            connectNulls={false}
            dataKey="durationSeconds"
            dot={{ r: 3 }}
            name="durationSeconds"
            stroke="var(--color-durationSeconds)"
            strokeWidth={3}
            type="monotone"
            yAxisId="duration"
          />
        </LineChart>
      </ChartContainer>
    </section>
  );
}

export { PersonalBestEffortTrendChart };
