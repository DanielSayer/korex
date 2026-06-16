import type {
  CurrentTrainingWeekQualifyingActivities,
  DashboardThisWeek,
  DashboardWeeklyDistance,
  DashboardWeeklyFocus,
  RecentActivity,
  TrainingStreak,
} from "@korex/api/modules/activities/activities.types";
import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { addDays, format, isSameDay } from "date-fns";
import {
  ActivityIcon,
  ChevronRightIcon,
  ClockIcon,
  FlameIcon,
  RouteIcon,
  TargetIcon,
} from "lucide-react";
import { ErrorMessage } from "@/components/error-message";
import { TrainingGoalsDashboardCard } from "@/features/training-goals/components/training-goals-dashboard-card";
import { cn } from "@/lib/utils";
import {
  formatDistance,
  formatDistanceValue,
  formatDurationClock,
} from "@/utils/formatters";
import { orpc } from "@/utils/orpc";
import { DashboardHeader } from "./dashboard-header";

type DashboardMobileProps = {
  hasError: boolean;
  isSummaryLoading: boolean;
  isSyncing: boolean;
  onSync: () => void;
  recentRuns: RecentActivity[];
  recentRunsLoading: boolean;
  thisWeek?: DashboardThisWeek;
  weeklyDistance?: DashboardWeeklyDistance;
};

function DashboardMobile({
  hasError,
  isSummaryLoading,
  isSyncing,
  onSync,
  recentRuns,
  recentRunsLoading,
  thisWeek,
  weeklyDistance,
}: DashboardMobileProps) {
  return (
    <div className="grid gap-3 p-3">
      <MobileDashboardHeader isSyncing={isSyncing} onSync={onSync} />
      {hasError ? (
        <ErrorMessage
          message="Could not load dashboard data."
          variant="banner"
        />
      ) : null}
      <CompactFocusPanel
        focus={thisWeek?.weeklyFocus}
        isLoading={isSummaryLoading}
      />
      <CompactMetricStrip
        isLoading={isSummaryLoading}
        thisWeek={thisWeek}
        weeklyDistance={weeklyDistance}
      />
      <CompactTrainingStreak />
      <CompactRecentActivityList
        isLoading={recentRunsLoading}
        runs={recentRuns}
      />
      <TrainingGoalsDashboardCard />
    </div>
  );
}

function MobileDashboardHeader({
  isSyncing,
  onSync,
}: {
  isSyncing: boolean;
  onSync: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-semibold text-primary text-xs uppercase">
          Dashboard
        </p>
        <h1 className="mt-1 truncate font-semibold text-2xl tracking-tight">
          This week
        </h1>
      </div>
      <DashboardHeader isSyncing={isSyncing} onSync={onSync} />
    </header>
  );
}

function CompactFocusPanel({
  focus,
  isLoading,
}: {
  focus?: DashboardWeeklyFocus;
  isLoading: boolean;
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-primary text-xs uppercase">
            Weekly Focus
          </p>
          <h2 className="mt-2 line-clamp-1 font-semibold text-xl">
            {isLoading ? "Reading this week." : (focus?.title ?? "Build.")}
          </h2>
        </div>
        <p className="shrink-0 rounded-full bg-muted px-2 py-1 font-medium text-muted-foreground text-xs">
          {isLoading ? "..." : (focus?.status ?? "steady")}
        </p>
      </div>
      <p className="mt-3 line-clamp-2 text-muted-foreground text-sm">
        {isLoading
          ? "Checking current training signals."
          : (focus?.body ?? "Keep the next session repeatable.")}
      </p>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <TargetIcon className="size-4 text-primary" />
        <span className="line-clamp-1 font-medium">
          {isLoading ? "Preparing next step" : (focus?.action ?? "One run")}
        </span>
      </div>
    </section>
  );
}

function CompactMetricStrip({
  isLoading,
  thisWeek,
  weeklyDistance,
}: {
  isLoading: boolean;
  thisWeek?: DashboardThisWeek;
  weeklyDistance?: DashboardWeeklyDistance;
}) {
  const metrics = [
    {
      icon: RouteIcon,
      label: "Distance",
      unit: "km",
      value: isLoading
        ? "--"
        : formatDistanceValue(
            thisWeek?.distanceMeters ??
              weeklyDistance?.thisWeekDistanceMeters ??
              null,
          ),
    },
    {
      icon: ClockIcon,
      label: "Time",
      unit: "",
      value: isLoading
        ? "--"
        : formatDurationClock(thisWeek?.durationSeconds ?? 0),
    },
    {
      icon: ActivityIcon,
      label: "Runs",
      unit: "",
      value: isLoading ? "--" : String(thisWeek?.activityCount ?? 0),
    },
  ];

  return (
    <section className="grid grid-cols-3 gap-2">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <div
            className="min-w-0 rounded-lg border border-border/60 bg-card p-3"
            key={metric.label}
          >
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{metric.label}</span>
            </div>
            <p className="mt-2 truncate font-semibold text-lg tabular-nums">
              {metric.value}
              {metric.unit ? (
                <span className="ml-1 font-normal text-muted-foreground text-xs">
                  {metric.unit}
                </span>
              ) : null}
            </p>
          </div>
        );
      })}
    </section>
  );
}

function CompactRecentActivityList({
  isLoading,
  runs,
}: {
  isLoading: boolean;
  runs: RecentActivity[];
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-card p-3">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-primary text-xs uppercase">
          Recent Activities
        </h2>
        <Link
          className="inline-flex items-center gap-1 text-muted-foreground text-xs"
          to="/calendar"
        >
          Calendar <ChevronRightIcon className="size-3" />
        </Link>
      </div>
      {isLoading ? (
        <div className="grid min-h-20 place-items-center text-muted-foreground text-sm">
          Loading recent Activities...
        </div>
      ) : runs.length === 0 ? (
        <div className="grid min-h-20 place-items-center text-muted-foreground text-sm">
          No recent Activities yet.
        </div>
      ) : (
        <div className="grid divide-y divide-border/70">
          {runs.slice(0, 5).map((run) => (
            <Link
              className="grid gap-0.5 py-2 first:pt-1 last:pb-0"
              key={run.id}
              params={{ activityId: String(run.id) }}
              to="/activity/$activityId"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="line-clamp-1 font-medium text-sm">{run.name}</h3>
                <span className="shrink-0 font-medium text-xs">
                  {formatDistance(run.distanceMeters)}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {formatDurationClock(run.durationSeconds ?? null)}
                {run.averageHeartRateBeatsPerMinute
                  ? ` - ${run.averageHeartRateBeatsPerMinute} bpm`
                  : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function CompactTrainingStreak() {
  const [streakQuery, currentWeekQuery] = useQueries({
    queries: [
      orpc.activities.trainingStreak.queryOptions(),
      orpc.activities.trainingStreakCurrentWeek.queryOptions(),
    ],
  });

  if (streakQuery.isPending || currentWeekQuery.isPending) {
    return (
      <section className="h-20 animate-pulse rounded-xl border border-border/70 bg-card" />
    );
  }

  if (streakQuery.isError || currentWeekQuery.isError) {
    return (
      <ErrorMessage
        message="Could not load your training streak."
        variant="banner"
      />
    );
  }

  return (
    <CompactTrainingStreakView
      currentWeek={currentWeekQuery.data}
      streak={streakQuery.data}
    />
  );
}

function CompactTrainingStreakView({
  currentWeek,
  streak,
}: {
  currentWeek: CurrentTrainingWeekQualifyingActivities;
  streak: TrainingStreak | null;
}) {
  const weekStartAt = new Date(currentWeek.weekStartAt);
  const days = Array.from({ length: 7 }, (_, dayIndex) => {
    const date = addDays(weekStartAt, dayIndex);
    const hasActivity = currentWeek.activities.some((activity) =>
      isSameDay(new Date(activity.startAt), date),
    );

    return {
      date,
      dayLabel: format(date, "EEEEE"),
      hasActivity,
    };
  });

  return (
    <section className="rounded-xl border border-border/70 bg-card px-3 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-primary text-xs uppercase">
            Streak
          </h2>
          <p className="mt-1 font-semibold text-sm">
            {streak?.currentStreak ?? 0} weeks
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {days.map((day) => (
            <div
              className="grid justify-items-center gap-1"
              key={day.date.toISOString()}
            >
              <span className="text-[10px] text-muted-foreground">
                {day.dayLabel}
              </span>
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full border text-[10px]",
                  day.hasActivity
                    ? "border-primary/20 bg-primary/15 text-primary"
                    : "border-border bg-background text-muted-foreground",
                )}
                title={
                  day.hasActivity
                    ? "Qualifying activity logged"
                    : "No qualifying activity logged"
                }
              >
                {day.hasActivity ? (
                  <FlameIcon className="size-3.5 fill-primary" />
                ) : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { DashboardMobile };
