import type {
  ActivityListItem,
  ActivitySummary,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { cn } from "@korex/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { format, isSameMonth } from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  HeartPulseIcon,
  Loader2Icon,
  MountainIcon,
  RouteIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { SectionLabel, WaypointDot } from "@/components/brand";
import { ErrorMessage } from "@/components/error-message";
import { PageLayout } from "@/components/page-layout";
import {
  formatDistance,
  formatDurationClock,
  formatDurationCompact,
} from "@/utils/formatters";
import {
  type CalendarDay,
  getActivityDayKey,
  weekDayLabels,
} from "../utils/calendar-month";

type ActivityCalendarDesktopProps = {
  activities: ActivityListItem[];
  isError: boolean;
  isFetching: boolean;
  monthGrid: {
    days: CalendarDay[];
    monthLabel: string;
  };
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  onToday: () => void;
  summaries: ActivitySummary[];
  visibleMonth: Date;
};

function ActivityCalendarDesktop({
  activities,
  isError,
  isFetching,
  monthGrid,
  onNextMonth,
  onPreviousMonth,
  onToday,
  summaries,
  visibleMonth,
}: ActivityCalendarDesktopProps) {
  return (
    <PageLayout>
      <CalendarHeader
        monthLabel={monthGrid.monthLabel}
        onNextMonth={onNextMonth}
        onPreviousMonth={onPreviousMonth}
        onToday={onToday}
      />
      {isError ? (
        <ErrorMessage message="Could not load activities." variant="banner" />
      ) : null}
      <div className="relative min-w-0">
        <MonthGrid
          activities={activities}
          days={monthGrid.days}
          summaries={summaries}
          visibleMonth={visibleMonth}
        />
        {isFetching ? (
          <div
            className="absolute inset-x-0 top-0 z-10 flex items-center justify-center border-b bg-background/80 px-3 py-2 text-muted-foreground text-sm shadow-xs backdrop-blur-sm"
            aria-live="polite"
          >
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Loading activities
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}

function CalendarHeader({
  monthLabel,
  onNextMonth,
  onPreviousMonth,
  onToday,
}: {
  monthLabel: string;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  onToday: () => void;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <SectionLabel>Calendar</SectionLabel>
        <h1 className="mt-1 font-display text-4xl lowercase leading-none tracking-tight">
          {monthLabel}
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Activities by training week.
        </p>
      </div>
      <div className="shrink-0">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={onPreviousMonth}
          >
            <ChevronLeftIcon />
          </Button>
          <div className="min-w-36 text-center font-medium text-sm">
            {monthLabel}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={onNextMonth}
          >
            <ChevronRightIcon />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onToday}>
            Today
          </Button>
        </div>
      </div>
    </header>
  );
}

function MonthGrid({
  activities,
  days,
  summaries,
  visibleMonth,
}: {
  activities: ActivityListItem[];
  days: CalendarDay[];
  summaries: ActivitySummary[];
  visibleMonth: Date;
}) {
  const activitiesByDay = useMemo(
    () => groupActivitiesByDay(activities),
    [activities],
  );
  const summariesByWeek = useMemo(
    () => groupSummariesByWeek(summaries),
    [summaries],
  );
  const weeks = useMemo(() => getCalendarWeeks(days), [days]);

  return (
    <div className="overflow-x-auto border-border/50 border-t">
      <div className="grid min-w-240 grid-cols-[minmax(220px,0.9fr)_repeat(7,minmax(120px,1fr))]">
        <div className="border-border/40 border-r border-b px-4 py-3">
          <SectionLabel>Week</SectionLabel>
        </div>
        {weekDayLabels.map((day) => (
          <div
            key={day}
            className="border-border/40 border-r border-b px-2 py-3 text-center font-display text-muted-foreground text-xs uppercase tracking-[0.18em] last:border-r-0"
          >
            {day}
          </div>
        ))}
        {weeks.map((week) => (
          <WeekRow
            activitiesByDay={activitiesByDay}
            days={week}
            key={week[0].date.toISOString()}
            summary={summariesByWeek.get(getActivityDayKey(week[0].date))}
            visibleMonth={visibleMonth}
          />
        ))}
      </div>
    </div>
  );
}

function WeekRow({
  activitiesByDay,
  days,
  summary,
  visibleMonth,
}: {
  activitiesByDay: Map<string, ActivityListItem[]>;
  days: CalendarDay[];
  summary: ActivitySummary | undefined;
  visibleMonth: Date;
}) {
  return (
    <>
      <WeekSummary summary={summary} />
      {days.map((day) => (
        <CalendarCell
          activities={activitiesByDay.get(getActivityDayKey(day.date)) ?? []}
          day={day}
          key={day.date.toISOString()}
          visibleMonth={visibleMonth}
        />
      ))}
    </>
  );
}

function WeekSummary({ summary }: { summary: ActivitySummary | undefined }) {
  if (!summary) {
    return (
      <section className="border-border/40 border-r border-b bg-muted/15" />
    );
  }

  const weekStartDate = new Date(summary.weekStartDate);

  return (
    <section className="overflow-hidden border-border/40 border-r border-b px-4 py-4">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg leading-none">
          Week {format(weekStartDate, "I")}
        </h3>
        <span className="font-display text-muted-foreground text-sm">
          {format(weekStartDate, "MMM d")}
        </span>
      </div>
      <dl className="grid gap-3 border-border/30 border-l pl-3">
        <SummaryMetric
          icon={<ClockIcon />}
          label="Total time"
          value={formatDurationCompact(summary.durationSeconds)}
        />
        <SummaryMetric
          icon={<MountainIcon />}
          label="Elevation gain"
          value={formatElevation(summary.totalElevationGainMeters)}
        />
        <SummaryMetric
          icon={<RouteIcon />}
          label="Total distance"
          value={formatDistance(summary.distanceMeters)}
        />
      </dl>
    </section>
  );
}

function SummaryMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="inline-flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wider">
        <span className="[&>svg]:size-3">{icon}</span>
        <span className="truncate">{label}</span>
      </dt>
      <dd className="shrink-0 font-display text-sm tabular-nums">{value}</dd>
    </div>
  );
}

function CalendarCell({
  activities,
  day,
  visibleMonth,
}: {
  activities: ActivityListItem[];
  day: CalendarDay;
  visibleMonth: Date;
}) {
  const isOutsideMonth = !isSameMonth(day.date, visibleMonth);

  return (
    <div
      className={cn(
        "min-h-32 overflow-hidden border-border/40 border-r border-b p-2 last:border-r-0",
        isOutsideMonth && "bg-muted/15 text-muted-foreground",
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full font-medium text-xs",
            day.isToday && "bg-primary text-primary-foreground shadow-xs",
          )}
        >
          {day.dayLabel}
        </span>
      </div>
      <div className="space-y-1.5">
        {activities.map((activity) => (
          <ActivityCard activity={activity} key={activity.id} />
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: ActivityListItem }) {
  return (
    <Link
      to="/activity/$activityId"
      params={{ activityId: String(activity.id) }}
      className="group block border-border/30 border-l py-1.5 pr-1 pl-2 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="line-clamp-1 inline-flex min-w-0 items-center gap-1.5 font-medium text-xs">
          <WaypointDot className="size-1.5 text-primary" filled />
          {activity.name}
        </h2>
        <span className="shrink-0 font-display text-[11px] text-muted-foreground tabular-nums">
          {format(new Date(activity.startAt), "HH:mm")}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <RouteIcon className="size-3" />
          {formatDistance(activity.distanceMeters)}
        </span>
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="size-3" />
          {formatDurationClock(activity.durationSeconds)}
        </span>
        {activity.averageHeartRateBeatsPerMinute ? (
          <span className="inline-flex items-center gap-1">
            <HeartPulseIcon className="size-3" />
            {activity.averageHeartRateBeatsPerMinute}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function groupActivitiesByDay(activities: ActivityListItem[]) {
  const activitiesByDay = new Map<string, ActivityListItem[]>();

  for (const activity of activities) {
    const key = getActivityDayKey(activity.startAt);
    activitiesByDay.set(key, [...(activitiesByDay.get(key) ?? []), activity]);
  }

  return activitiesByDay;
}

function groupSummariesByWeek(summaries: ActivitySummary[]) {
  const summariesByWeek = new Map<string, ActivitySummary>();

  for (const summary of summaries) {
    summariesByWeek.set(getActivityDayKey(summary.weekStartDate), summary);
  }

  return summariesByWeek;
}

function getCalendarWeeks(days: CalendarDay[]) {
  const weeks: CalendarDay[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

function formatElevation(elevationMeters: number) {
  return `${Math.round(elevationMeters)} m`;
}

export { ActivityCalendarDesktop };
