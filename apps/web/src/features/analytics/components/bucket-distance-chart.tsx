import type { AnalyticsVolume } from "@korex/api/modules/activities/activities.types";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@korex/ui/components/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { SectionLabel } from "@/components/brand";
import {
  chartAxisTick,
  formatKilometers,
  getBucketLabel,
  getFullBucketLabel,
  getXAxisInterval,
} from "./analytics-chart-utils";

function BucketDistanceChart({ analytics }: { analytics: AnalyticsVolume }) {
  const title =
    analytics.bucketMode === "monthly" ? "Monthly distance" : "Weekly distance";
  const chartData = analytics.buckets.map((bucket) => ({
    activityCount: bucket.activityCount,
    distanceKilometers: bucket.distanceMeters / 1000,
    fullLabel: getFullBucketLabel(bucket, analytics.bucketMode),
    label: getBucketLabel(bucket, analytics.bucketMode),
  }));
  const chartConfig = {
    distanceKilometers: {
      color: "var(--chart-1)",
      label: title,
    },
  } satisfies ChartConfig;

  return (
    <section className="flex min-w-0 flex-col gap-3 overflow-hidden">
      <SectionLabel>{title}</SectionLabel>
      <ChartContainer
        className="aspect-auto h-64 w-full min-w-0 max-w-full sm:h-80"
        config={chartConfig}
      >
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ bottom: 8, left: 4, right: 0, top: 12 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="2 8"
            vertical={false}
          />
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
            yAxisId="distance"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => (
                  <div className="grid flex-1 gap-1.5">
                    <div className="flex justify-between gap-6">
                      <span className="text-muted-foreground">Distance</span>
                      <span className="font-medium font-mono tabular-nums">
                        {formatKilometers(value)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-muted-foreground">Activities</span>
                      <span className="font-medium font-mono tabular-nums">
                        {item.payload.activityCount}
                      </span>
                    </div>
                  </div>
                )}
                labelFormatter={(_, payload) => payload[0]?.payload.fullLabel}
              />
            }
            cursor={{ fill: "var(--muted)" }}
          />
          <Bar
            dataKey="distanceKilometers"
            fill="var(--color-distanceKilometers)"
            name="distanceKilometers"
            radius={[4, 4, 0, 0]}
            yAxisId="distance"
          />
        </BarChart>
      </ChartContainer>
    </section>
  );
}

export { BucketDistanceChart };
