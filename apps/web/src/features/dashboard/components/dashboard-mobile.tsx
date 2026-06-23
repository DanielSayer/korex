import type {
  CurrentTrainingWeekQualifyingActivities,
  DashboardThisWeek,
  DashboardWeeklyDistance,
  DashboardWeeklyFocus,
  RecentActivity,
  TrainingStreak,
} from "@korex/api/modules/activities/activities.types";
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
import { RouteAccent, SectionLabel, StrideTexture } from "./dashboard-brand";
import { DashboardHeader } from "./dashboard-header";

type DashboardMobileProps = {
  hasError: boolean;
  isSummaryLoading: boolean;
  isSyncing: boolean;
  onSync: () => void;
  recentRuns: RecentActivity[];
  recentRunsLoading: boolean;
  currentWeek?: CurrentTrainingWeekQualifyingActivities;
  streak?: TrainingStreak | null;
  streakHasError: boolean;
  streakLoading: boolean;
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
  currentWeek,
  streak,
  streakHasError,
  streakLoading,
  thisWeek,
  weeklyDistance,
}: DashboardMobileProps) {
  return (
    <div className="flex flex-col gap-7 p-4">
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
      <CompactTrainingStreak
        currentWeek={currentWeek}
        isError={streakHasError}
        isLoading={streakLoading}
        streak={streak}
      />
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
  const now = new Date();
  const hour = now.getHours();
  const partOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <header className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="font-display text-3xl lowercase leading-none tracking-tight">
          korex
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          {format(now, "EEEE")} {partOfDay}. Let's move.
        </p>
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
    <section className="relative overflow-hidden rounded-3xl bg-primary/5 p-5">
      <StrideTexture />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <p className="font-display text-[11px] text-primary uppercase tracking-[0.18em]">
            Weekly Focus
          </p>
          <p className="shrink-0 rounded-full bg-background/70 px-2.5 py-0.5 font-medium text-primary text-xs">
            {isLoading ? "..." : (focus?.status ?? "steady")}
          </p>
        </div>
        <h2 className="mt-3 line-clamp-2 font-display text-4xl leading-[1.05] tracking-tight">
          {isLoading ? "Reading this week." : (focus?.title ?? "Build.")}
        </h2>
        <RouteAccent className="mt-3 h-3 w-16 text-primary" />
        <p className="mt-3 line-clamp-2 text-muted-foreground text-sm leading-relaxed">
          {isLoading
            ? "Checking current training signals."
            : (focus?.body ?? "Keep the next session repeatable.")}
        </p>
        <div className="mt-4 flex items-center gap-2 font-medium text-sm">
          <TargetIcon className="size-4 text-primary" />
          <span className="line-clamp-1">
            {isLoading ? "Preparing next step" : (focus?.action ?? "One run")}
          </span>
        </div>
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
    <section className="grid grid-cols-3 divide-x divide-border/30">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <div
            className="flex flex-col items-center gap-1.5 px-2 text-center first:pl-0 last:pr-0"
            key={metric.label}
          >
            <span className="flex items-center gap-1 text-muted-foreground">
              <Icon className="size-3.5" />
              <span className="text-[11px] uppercase tracking-wider">
                {metric.label}
              </span>
            </span>
            <p className="font-display text-3xl tabular-nums leading-none">
              {metric.value}
              {metric.unit ? (
                <span className="ml-1 font-medium font-sans text-muted-foreground text-sm">
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
    <section className="flex flex-col gap-3">
      <SectionLabel
        action={
          <Link
            className="inline-flex items-center gap-1 text-muted-foreground text-xs"
            to="/calendar"
          >
            Calendar <ChevronRightIcon className="size-3" />
          </Link>
        }
      >
        Recent
      </SectionLabel>
      {isLoading ? (
        <div className="py-6 text-center text-muted-foreground text-sm">
          Loading recent Activities...
        </div>
      ) : runs.length === 0 ? (
        <RecentActivityEmpty />
      ) : (
        <ol className="flex flex-col">
          {runs.slice(0, 5).map((run) => (
            <li key={run.id}>
              <Link
                className="flex items-center gap-3 py-3"
                params={{ activityId: String(run.id) }}
                to="/activity/$activityId"
              >
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full bg-primary"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="line-clamp-1 font-medium text-sm">
                      {run.name}
                    </span>
                    <span className="shrink-0 font-display text-sm tabular-nums">
                      {formatDistance(run.distanceMeters)}
                    </span>
                  </span>
                  <span className="block text-muted-foreground text-xs">
                    {formatDurationClock(run.durationSeconds ?? null)}
                    {run.averageHeartRateBeatsPerMinute
                      ? ` · ${run.averageHeartRateBeatsPerMinute} bpm`
                      : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function RecentActivityEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <img
        alt="An empty winding trail cresting a small hill with a single route waypoint marker"
        className="h-20 w-auto opacity-90"
        src="/brand/empty-trail.svg"
      />
      <p className="text-muted-foreground text-sm">
        No runs logged yet. Your trail starts here.
      </p>
    </div>
  );
}

function CompactTrainingStreak({
  currentWeek,
  isError,
  isLoading,
  streak,
}: {
  currentWeek?: CurrentTrainingWeekQualifyingActivities;
  isError: boolean;
  isLoading: boolean;
  streak?: TrainingStreak | null;
}) {
  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-3xl bg-muted/50" />;
  }

  if (isError || !currentWeek) {
    return (
      <ErrorMessage
        message="Could not load your training streak."
        variant="banner"
      />
    );
  }

  return (
    <CompactTrainingStreakView
      currentWeek={currentWeek}
      streak={streak ?? null}
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
    <section className="flex flex-col gap-4">
      <SectionLabel
        action={
          <span className="font-display text-base">
            {streak?.currentStreak ?? 0}
            <span className="ml-1 font-normal font-sans text-muted-foreground text-xs">
              weeks
            </span>
          </span>
        }
      >
        Streak
      </SectionLabel>
      <div className="relative px-1">
        <div
          aria-hidden="true"
          className="absolute top-[9px] right-3 left-3 h-0.5 rounded-full bg-border"
        />
        <ol className="relative flex items-start justify-between">
          {days.map((day) => (
            <li
              className="flex flex-col items-center gap-2"
              key={day.date.toISOString()}
            >
              <span
                className={cn(
                  "grid size-[18px] place-items-center rounded-full border-2 transition-colors",
                  day.hasActivity
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
                title={
                  day.hasActivity
                    ? "Qualifying activity logged"
                    : "No qualifying activity logged"
                }
              >
                {day.hasActivity ? <FlameIcon className="size-2.5" /> : null}
              </span>
              <span className="font-medium text-[10px] text-muted-foreground">
                {day.dayLabel}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export { DashboardMobile };
