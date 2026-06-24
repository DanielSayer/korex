import type { DashboardWeeklyDistance } from "@korex/api/modules/activities/activities.types";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@korex/ui/components/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { SectionLabel } from "@/components/brand";
import { formatDistance, formatDistanceValue } from "@/utils/formatters";
import {
  formatLongDate,
  formatShortDate,
  formatWeekRange,
} from "./weekly-distance-formatters";

type WeeklyDistanceWidgetProps = {
  weeklyDistance: DashboardWeeklyDistance;
};

type WeeklyDistanceChartPoint = {
  dateLabel: string;
  distanceKilometers: number;
  fullDateLabel: string;
  isCurrentWeek: boolean;
};

const chartConfig = {
  distanceKilometers: {
    color: "var(--chart-1)",
    label: "Weekly distance",
  },
} satisfies ChartConfig;

function WeeklyDistanceWidget({ weeklyDistance }: WeeklyDistanceWidgetProps) {
  const chartData = weeklyDistance.weeklyDistanceBuckets.map((bucket, index) =>
    toChartPoint({
      bucketStartAt: bucket.bucketStartAt,
      distanceMeters: bucket.distanceMeters,
      isCurrentWeek: index === weeklyDistance.weeklyDistanceBuckets.length - 1,
    }),
  );
  const deltaClassName =
    weeklyDistance.distanceDeltaMeters >= 0
      ? "text-primary"
      : "text-foreground";

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionLabel>This week trend</SectionLabel>
        <p className="text-muted-foreground text-xs">
          {formatWeekRange(weeklyDistance.weekStartAt)}
        </p>
      </div>
      <div className="grid gap-5">
        <div className="grid gap-4">
          <div>
            <p className="font-medium text-muted-foreground text-xs uppercase">
              This week
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-5xl tracking-tight">
                {formatDistanceValue(weeklyDistance.thisWeekDistanceMeters)}
              </span>
              <span className="text-muted-foreground text-sm">km</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-muted-foreground text-xs uppercase">
                Vs last week
              </p>
              <p className={`font-semibold text-sm ${deltaClassName}`}>
                {formatSignedDistance(weeklyDistance.distanceDeltaMeters)}
              </p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground text-xs uppercase">
                Avg/week
              </p>
              <p className="font-semibold text-sm">
                {formatDistance(weeklyDistance.averageWeeklyDistanceMeters)}
              </p>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <ChartContainer
            className="aspect-auto h-44 w-full"
            config={chartConfig}
            initialDimension={{ width: 520, height: 176 }}
          >
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ bottom: 4, left: 0, right: 0, top: 8 }}
            >
              <defs>
                <linearGradient
                  id="weeklyDistanceFill"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-distanceKilometers)"
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-distanceKilometers)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 6" />
              <XAxis
                axisLine={false}
                dataKey="dateLabel"
                interval={2}
                minTickGap={16}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                }}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                }}
                tickFormatter={(value) => `${value}`}
                tickLine={false}
                tickMargin={8}
                width={28}
              />
              <ReferenceLine stroke="var(--border)" y={0} />
              <ChartTooltip
                content={<WeeklyDistanceTooltip />}
                cursor={{ stroke: "var(--muted-foreground)" }}
              />
              <Area
                dataKey="distanceKilometers"
                fill="url(#weeklyDistanceFill)"
                fillOpacity={1}
                stroke="var(--color-distanceKilometers)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </section>
  );
}

function WeeklyDistanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: WeeklyDistanceChartPoint }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm shadow-xl">
      <p className="font-medium">
        {point.isCurrentWeek ? "This week" : point.fullDateLabel}
      </p>
      <p className="mt-1 text-muted-foreground">
        {point.distanceKilometers.toFixed(2)} km
      </p>
    </div>
  );
}

function toChartPoint({
  bucketStartAt,
  distanceMeters,
  isCurrentWeek,
}: {
  bucketStartAt: Date | string;
  distanceMeters: number;
  isCurrentWeek: boolean;
}): WeeklyDistanceChartPoint {
  const date = new Date(bucketStartAt);

  return {
    dateLabel: formatShortDate(date),
    distanceKilometers: distanceMeters / 1000,
    fullDateLabel: formatLongDate(date),
    isCurrentWeek,
  };
}

function formatSignedDistance(distanceMeters: number) {
  const sign = distanceMeters >= 0 ? "+" : "-";

  return `${sign}${formatDistance(Math.abs(distanceMeters))}`;
}

export { WeeklyDistanceWidget };
