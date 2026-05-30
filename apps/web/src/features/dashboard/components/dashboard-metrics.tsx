import type {
  DashboardWeeklyDistance,
  RecentActivity,
} from "@korex/api/modules/activities/activities.types";
import {
  type ActivityIcon,
  FlameIcon,
  FootprintsIcon,
  GaugeIcon,
  HeartIcon,
  TimerIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDistance,
  formatDistanceValue,
  formatDurationClock,
} from "@/utils/formatters";

type DashboardMetricsProps = {
  isLoading: boolean;
  recentRuns: RecentActivity[];
  weeklyDistance?: DashboardWeeklyDistance;
};

type DashboardStat = {
  delta: string;
  deltaTone: "good" | "warn";
  icon: typeof ActivityIcon;
  id: string;
  label: string;
  sublabel: string;
  unit: string;
  value: string;
};

function DashboardMetrics({
  isLoading,
  recentRuns,
  weeklyDistance,
}: DashboardMetricsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {buildStats({ recentRuns, weeklyDistance }).map((stat) => (
        <MetricCard isLoading={isLoading} key={stat.id} stat={stat} />
      ))}
    </section>
  );
}

function MetricCard({
  isLoading,
  stat,
}: {
  isLoading: boolean;
  stat: DashboardStat;
}) {
  const Icon = stat.icon;
  const TrendIcon =
    stat.deltaTone === "good" ? TrendingUpIcon : TrendingDownIcon;

  return (
    <section className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-muted-foreground text-xs uppercase">
            {stat.label}
          </p>
          <p className="mt-1 flex items-baseline gap-1 font-semibold text-2xl tabular-nums">
            {isLoading ? "--" : stat.value}
            <span className="font-normal text-muted-foreground text-sm">
              {stat.unit}
            </span>
          </p>
          <p className="text-muted-foreground text-sm">{stat.sublabel}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs">
        <TrendIcon
          className={cn(
            "size-3.5",
            stat.deltaTone === "good"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive",
          )}
        />
        <span
          className={cn(
            "font-semibold",
            stat.deltaTone === "good"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive",
          )}
        >
          {isLoading ? "--" : stat.delta}
        </span>
        <span className="text-muted-foreground">vs last week</span>
      </div>
    </section>
  );
}

function buildStats({
  recentRuns,
  weeklyDistance,
}: {
  recentRuns: RecentActivity[];
  weeklyDistance?: DashboardWeeklyDistance;
}): DashboardStat[] {
  const thisWeekDistance = weeklyDistance?.thisWeekDistanceMeters ?? null;
  const thisWeekRuns = recentRuns.filter((run) =>
    weeklyDistance
      ? new Date(run.startAt) >= new Date(weeklyDistance.weekStartAt)
      : false,
  );
  const totalDuration = sum(
    thisWeekRuns.map((run) => run.durationSeconds ?? 0),
  );
  const averagePaceSeconds =
    thisWeekDistance && totalDuration > 0
      ? totalDuration / (thisWeekDistance / 1000)
      : null;
  const averageHeartRate = average(
    thisWeekRuns
      .map((run) => run.averageHeartRateBeatsPerMinute)
      .filter((value): value is number => value !== null),
  );
  const calories = Math.round(((thisWeekDistance ?? 0) / 1000) * 83);

  return [
    {
      delta: formatSignedDistance(weeklyDistance?.distanceDeltaMeters ?? 0),
      deltaTone: "good",
      icon: FootprintsIcon,
      id: "distance",
      label: "This week",
      sublabel: "Distance",
      unit: "km",
      value: formatDistanceValue(thisWeekDistance),
    },
    {
      delta: formatDurationClock(totalDuration),
      deltaTone: "good",
      icon: TimerIcon,
      id: "time",
      label: "This week",
      sublabel: "Time",
      unit: "",
      value: formatDurationClock(totalDuration),
    },
    {
      delta: "--",
      deltaTone: "good",
      icon: GaugeIcon,
      id: "pace",
      label: "Avg pace",
      sublabel: "Average",
      unit: "/km",
      value: averagePaceSeconds ? formatPaceSeconds(averagePaceSeconds) : "--",
    },
    {
      delta: "--",
      deltaTone: "warn",
      icon: HeartIcon,
      id: "heart-rate",
      label: "Avg HR",
      sublabel: "Average",
      unit: "bpm",
      value: averageHeartRate ? Math.round(averageHeartRate).toString() : "--",
    },
    {
      delta: "--",
      deltaTone: "good",
      icon: FlameIcon,
      id: "calories",
      label: "Calories",
      sublabel: "Estimated",
      unit: "kcal",
      value: calories > 0 ? calories.toString() : "--",
    },
  ];
}

function formatPaceSeconds(seconds: number) {
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatSignedDistance(distanceMeters: number) {
  const sign = distanceMeters >= 0 ? "+" : "-";
  return `${sign}${formatDistance(Math.abs(distanceMeters))}`;
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return sum(values) / values.length;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export { DashboardMetrics };
