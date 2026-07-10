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
    color: "var(--color-journal-route)",
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
  const currentWeekActivityCount =
    weeklyDistance.weeklyDistanceBuckets.at(-1)?.activityCount ?? 0;

  return (
    <section>
      <div className="flex items-end justify-between gap-6">
        <div>
          <SectionLabel>Weekly distance</SectionLabel>
          <h2 className="mt-2 font-display font-medium text-2xl">
            Your recent rhythm
          </h2>
        </div>
        <div className="text-right">
          <p className="flex items-baseline justify-end gap-2">
            <span className="font-display font-medium text-4xl tabular-nums tracking-tight">
              {formatDistanceValue(weeklyDistance.thisWeekDistanceMeters)}
            </span>
            <span className="text-muted-foreground text-sm">km this week</span>
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {formatWeekRange(weeklyDistance.weekStartAt)}
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-[10rem_minmax(0,1fr)] gap-5">
        <div className="flex flex-col justify-center divide-y divide-border">
          <DistanceStat
            label="Vs last week"
            value={formatSignedDistance(weeklyDistance.distanceDeltaMeters)}
          />
          <DistanceStat
            label="Average / week"
            value={formatDistance(weeklyDistance.averageWeeklyDistanceMeters)}
          />
          <DistanceStat
            label="Activities"
            value={String(currentWeekActivityCount)}
          />
        </div>
        <div className="min-w-0 flex-1">
          <ChartContainer
            className="aspect-auto h-56 w-full"
            config={chartConfig}
            initialDimension={{ height: 224, width: 620 }}
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
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-distanceKilometers)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="2 7"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="dateLabel"
                interval={1}
                minTickGap={12}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 9,
                }}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 9,
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
                strokeWidth={2.5}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </section>
  );
}

function DistanceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <p className="text-[9px] text-muted-foreground uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-1 font-display font-medium text-lg tabular-nums">
        {value}
      </p>
    </div>
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
