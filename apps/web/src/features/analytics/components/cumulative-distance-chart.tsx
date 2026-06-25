import type { AnalyticsVolume } from "@korex/api/modules/activities/activities.types";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@korex/ui/components/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { SectionLabel } from "@/components/brand";
import {
  chartAxisTick,
  formatKilometers,
  getBucketLabel,
  getXAxisInterval,
} from "./analytics-chart-utils";

function CumulativeDistanceChart({
  analytics,
}: {
  analytics: AnalyticsVolume;
}) {
  const chartData = analytics.buckets.map((bucket) => ({
    cumulativeDistanceKilometers: bucket.cumulativeDistanceMeters / 1000,
    label: getBucketLabel(bucket, analytics.bucketMode),
  }));
  const chartConfig = {
    cumulativeDistanceKilometers: {
      color: "var(--chart-2)",
      label: "Cumulative distance",
    },
  } satisfies ChartConfig;

  return (
    <section className="flex min-w-0 flex-col gap-3 overflow-hidden">
      <SectionLabel>Cumulative distance</SectionLabel>
      <ChartContainer
        className="aspect-auto h-64 w-full min-w-0 max-w-full sm:h-80"
        config={chartConfig}
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ bottom: 8, left: 4, right: 0, top: 12 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 6" />
          <XAxis
            axisLine={false}
            dataKey="label"
            interval={getXAxisInterval(analytics.bucketMode)}
            minTickGap={8}
            tick={chartAxisTick}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={chartAxisTick}
            tickFormatter={(value) => `${value} km`}
            tickLine={false}
            width={64}
            yAxisId="cumulative"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => formatKilometers(value)}
              />
            }
            cursor={{ stroke: "var(--muted-foreground)" }}
          />
          <Line
            dataKey="cumulativeDistanceKilometers"
            dot={false}
            name="Cumulative distance"
            stroke="var(--color-cumulativeDistanceKilometers)"
            strokeWidth={3}
            type="monotone"
            yAxisId="cumulative"
          />
        </LineChart>
      </ChartContainer>
    </section>
  );
}

export { CumulativeDistanceChart };
