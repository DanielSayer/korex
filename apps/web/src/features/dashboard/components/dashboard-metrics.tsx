import type {
  DashboardThisWeek,
  DashboardWeeklyDistance,
} from "@korex/api/modules/activities/activities.types";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDistance,
  formatDistanceValue,
  formatDurationClock,
} from "@/utils/formatters";

type DashboardMetricsProps = {
  isLoading: boolean;
  thisWeek?: DashboardThisWeek;
  weeklyDistance?: DashboardWeeklyDistance;
};

type DashboardStat = {
  delta: string;
  deltaTone: "good" | "warn";
  id: string;
  label: string;
  sublabel: string;
  unit: string;
  value: string;
};

function DashboardMetrics({
  isLoading,
  thisWeek,
  weeklyDistance,
}: DashboardMetricsProps) {
  return (
    <section className="grid grid-cols-2 gap-0 xl:grid-cols-4">
      {buildStats({ thisWeek, weeklyDistance }).map((stat) => (
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
  const TrendIcon =
    stat.deltaTone === "good" ? TrendingUpIcon : TrendingDownIcon;

  return (
    <section className="border-border/70 border-t px-4 py-4 odd:border-r sm:px-6 sm:first:pl-0 xl:border-t-0 xl:border-r xl:last:border-r-0">
      <div className="min-w-0">
        <p className="font-semibold text-[11px] text-primary uppercase">
          {stat.label}
        </p>
        <p className="mt-1 flex items-baseline gap-1 whitespace-nowrap font-semibold font-serif text-3xl tabular-nums">
          {isLoading ? "--" : stat.value}
          <span className="min-w-0 font-normal font-sans text-muted-foreground text-sm">
            {stat.unit}
          </span>
        </p>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        <TrendIcon
          className={cn(
            "size-3.5",
            stat.deltaTone === "good"
              ? "text-emerald-600 dark:text-emerald-300"
              : "text-destructive",
          )}
        />
        <span
          className={cn(
            "font-semibold",
            stat.deltaTone === "good"
              ? "text-emerald-600 dark:text-emerald-300"
              : "text-destructive",
          )}
        >
          {isLoading ? "--" : stat.delta}
        </span>
        <span className="text-muted-foreground">{stat.sublabel}</span>
      </div>
    </section>
  );
}

function buildStats({
  thisWeek,
  weeklyDistance,
}: {
  thisWeek?: DashboardThisWeek;
  weeklyDistance?: DashboardWeeklyDistance;
}): DashboardStat[] {
  const thisWeekDistance =
    thisWeek?.distanceMeters ?? weeklyDistance?.thisWeekDistanceMeters ?? null;
  const totalDuration = thisWeek?.durationSeconds ?? 0;
  const averagePaceSeconds = thisWeek?.averagePaceSecondsPerKilometer ?? null;
  const averageHeartRate = thisWeek?.averageHeartRateBeatsPerMinute ?? null;
  return [
    {
      delta: formatSignedDistance(weeklyDistance?.distanceDeltaMeters ?? 0),
      deltaTone: "good",
      id: "distance",
      label: "Distance",
      sublabel: "vs last week",
      unit: "km",
      value: formatDistanceValue(thisWeekDistance),
    },
    {
      delta: "4:19",
      deltaTone: "good",
      id: "time",
      label: "Time",
      sublabel: "vs last week",
      unit: "",
      value: formatDurationClock(totalDuration),
    },
    {
      delta: "Faster",
      deltaTone: "good",
      id: "pace",
      label: "Avg pace",
      sublabel: "vs last week",
      unit: "/km",
      value: averagePaceSeconds ? formatPaceSeconds(averagePaceSeconds) : "--",
    },
    {
      delta: "+2 bpm",
      deltaTone: "warn",
      id: "heart-rate",
      label: "Avg HR",
      sublabel: "vs last week",
      unit: "bpm",
      value: averageHeartRate ? Math.round(averageHeartRate).toString() : "--",
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

export { DashboardMetrics };
