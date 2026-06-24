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
  TargetIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  RouteAccent,
  SectionLabel,
  StrideTexture,
  WaypointDot,
} from "@/components/brand";
import { ErrorMessage } from "@/components/error-message";
import { TrainingGoalsDashboardCard } from "@/features/training-goals/components/training-goals-dashboard-card";
import { cn } from "@/lib/utils";
import {
  formatDistance,
  formatDistanceValue,
  formatDurationClock,
} from "@/utils/formatters";
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
      <TrailheadHero
        focus={thisWeek?.weeklyFocus}
        isLoading={isSummaryLoading}
        thisWeek={thisWeek}
        weeklyDistance={weeklyDistance}
      />
      <TrailSpine>
        <SpineSection className="pb-7">
          <CompactTrainingStreak
            currentWeek={currentWeek}
            isError={streakHasError}
            isLoading={streakLoading}
            streak={streak}
          />
        </SpineSection>
        <SpineSignpost className="pb-1">
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
        </SpineSignpost>
        <CompactRecentActivityList
          isLoading={recentRunsLoading}
          runs={recentRuns}
        />
        <SpineSection className="pt-7">
          <TrainingGoalsDashboardCard />
        </SpineSection>
      </TrailSpine>
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
        <p className="flex items-baseline gap-1.5 font-display text-4xl lowercase leading-none tracking-tight">
          korex
          <WaypointDot className="translate-y-[-0.125em]" />
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          {format(now, "EEEE")} {partOfDay}. Let's move.
        </p>
      </div>
      <DashboardHeader isSyncing={isSyncing} onSync={onSync} />
    </header>
  );
}

function TrailheadHero({
  focus,
  isLoading,
  thisWeek,
  weeklyDistance,
}: {
  focus?: DashboardWeeklyFocus;
  isLoading: boolean;
  thisWeek?: DashboardThisWeek;
  weeklyDistance?: DashboardWeeklyDistance;
}) {
  const distanceValue = isLoading
    ? "--"
    : formatDistanceValue(
        thisWeek?.distanceMeters ??
          weeklyDistance?.thisWeekDistanceMeters ??
          null,
      );

  return (
    <section className="relative overflow-hidden rounded-3xl bg-primary/5 p-6">
      <StrideTexture />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-[11px] text-primary uppercase tracking-[0.18em]">
            This week
          </p>
          <span className="shrink-0 rounded-full bg-background/70 px-2.5 py-0.5 font-medium text-primary text-xs">
            {isLoading ? "..." : (focus?.status ?? "steady")}
          </span>
        </div>

        <p className="mt-4 font-display text-[clamp(3.25rem,17vw,4.25rem)] tabular-nums leading-[0.9] tracking-tight">
          {distanceValue}
          <span className="ml-1.5 align-middle font-medium font-sans text-lg text-muted-foreground">
            km
          </span>
        </p>

        <RouteAccent className="mt-3 h-4 w-24 text-primary" />

        <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight">
          {isLoading ? "Reading this week." : (focus?.title ?? "Build.")}
        </h2>
        <p className="mt-1.5 line-clamp-2 text-muted-foreground text-sm leading-relaxed">
          {isLoading
            ? "Checking current training signals."
            : (focus?.body ?? "Keep the next session repeatable.")}
        </p>
        <div className="mt-3 flex items-center gap-2 font-medium text-sm">
          <TargetIcon className="size-4 text-primary" />
          <span className="line-clamp-1">
            {isLoading ? "Preparing next step" : (focus?.action ?? "One run")}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-4 border-border/40 border-t pt-4 text-muted-foreground text-xs">
          <span className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            <span className="tabular-nums">
              {isLoading
                ? "--"
                : formatDurationClock(thisWeek?.durationSeconds ?? 0)}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <ActivityIcon className="size-3.5" />
            <span className="tabular-nums">
              {isLoading ? "--" : `${thisWeek?.activityCount ?? 0} runs`}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

/**
 * The vertical route spine — a single hairline trail tying every section
 * together as waypoints. The trail *is* the layout.
 */
function TrailSpine({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute top-2 bottom-0 left-3 w-px bg-border [mask-image:linear-gradient(to_bottom,black_0,black_78%,transparent_100%)]"
      />
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function SpineSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative pl-9", className)}>
      <Marker className="top-2" />
      {children}
    </div>
  );
}

function SpineSignpost({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("relative pl-9", className)}>{children}</div>;
}

function Marker({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute left-3 -translate-x-1/2 -translate-y-1/2",
        className,
      )}
    >
      <WaypointDot filled={false} />
    </span>
  );
}

function CompactRecentActivityList({
  isLoading,
  runs,
}: {
  isLoading: boolean;
  runs: RecentActivity[];
}) {
  if (isLoading) {
    return (
      <div className="py-6 pl-9 text-muted-foreground text-sm">
        Loading recent activities...
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="pl-9">
        <RecentActivityEmpty />
      </div>
    );
  }

  return (
    <ol className="flex flex-col">
      {runs.slice(0, 5).map((run) => (
        <li className="relative pl-9" key={run.id}>
          <span
            aria-hidden="true"
            className="absolute top-5 left-3 -translate-x-1/2 -translate-y-1/2"
          >
            <WaypointDot />
          </span>
          <Link
            className="flex items-center gap-3 py-3"
            params={{ activityId: String(run.id) }}
            to="/activity/$activityId"
          >
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
  );
}

function RecentActivityEmpty() {
  return (
    <div className="flex flex-col items-start gap-3 py-3">
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
