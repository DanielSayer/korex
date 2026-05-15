import type {
  ActivityListItem,
  ActivitySummary,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { cn } from "@korex/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { addMonths, format, isSameMonth, subMonths } from "date-fns";
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
import { ErrorMessage } from "@/components/error-message";
import {
  formatDistance,
  formatDuration,
} from "@/features/dashboard/utils/activity-formatters";
import { orpc } from "@/utils/orpc";
import {
  type CalendarDay,
  getActivityDayKey,
  getMonthGrid,
  weekDayLabels,
} from "../utils/calendar-month";

type ActivityCalendarProps = {
  onMonthChange: (month: Date) => void;
  visibleMonth: Date;
};

function ActivityCalendar({
  onMonthChange,
  visibleMonth,
}: ActivityCalendarProps) {
  const monthGrid = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);
  const activitiesQuery = useQuery(
    orpc.activities.list.queryOptions({
      input: {
        endDate: monthGrid.gridEnd,
        startDate: monthGrid.gridStart,
      },
    }),
  );
  const activities = activitiesQuery.data?.activities ?? [];
  const summaries = activitiesQuery.data?.summaries ?? [];
  const showLoadingOverlay = activitiesQuery.isFetching;

  return (
    <section className="flex min-h-[calc(100svh-8.5rem)] flex-col gap-4">
      <CalendarHeader
        monthLabel={monthGrid.monthLabel}
        onNextMonth={() => onMonthChange(addMonths(visibleMonth, 1))}
        onPreviousMonth={() => onMonthChange(subMonths(visibleMonth, 1))}
        onToday={() => onMonthChange(new Date())}
      />
      {activitiesQuery.isError ? (
        <ErrorMessage message="Could not load activities." variant="banner" />
      ) : null}
      <div className="relative min-w-0">
        <MonthGrid
          activities={activities}
          days={monthGrid.days}
          summaries={summaries}
          visibleMonth={visibleMonth}
        />
        {showLoadingOverlay ? (
          <div
            className="absolute inset-x-0 top-0 z-10 flex items-center justify-center border-b bg-background/80 px-3 py-2 text-muted-foreground text-sm shadow-xs backdrop-blur-sm"
            aria-live="polite"
          >
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Loading activities
          </div>
        ) : null}
      </div>
    </section>
  );
}

function WeekSummary({ summary }: { summary: ActivitySummary | undefined }) {
  if (!summary) {
    return <section className="border-border border-r border-b bg-muted/20" />;
  }

  const weekStartDate = new Date(summary.weekStartDate);

  return (
    <section className="overflow-hidden border-border border-r border-b bg-background px-4 py-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-medium text-sm">
          Week {format(weekStartDate, "I")}
        </h3>
        <span className="text-muted-foreground text-xs">
          {format(weekStartDate, "MMM d")}
        </span>
      </div>
      <dl className="grid gap-3">
        <SummaryMetric
          icon={<ClockIcon />}
          label="Total time"
          value={formatSummaryDuration(summary.durationSeconds)}
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
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
        <span className="[&>svg]:size-3.5">{icon}</span>
        <span className="truncate">{label}</span>
      </dt>
      <dd className="shrink-0 font-semibold text-sm">{value}</dd>
    </div>
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Calendar</h1>
        <p className="text-muted-foreground text-sm">
          Activities by training week.
        </p>
      </div>
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
    <div className="overflow-x-auto rounded-lg border bg-background">
      <div className="grid min-w-240 grid-cols-[minmax(220px,0.9fr)_repeat(7,minmax(120px,1fr))]">
        <div className="border-border border-r border-b bg-muted/40 px-4 py-2 font-medium text-muted-foreground text-xs">
          Summary
        </div>
        {weekDayLabels.map((day) => (
          <div
            key={day}
            className="border-border border-r border-b bg-muted/40 px-2 py-2 text-center font-medium text-muted-foreground text-xs last:border-r-0"
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
        "min-h-32 overflow-hidden border-border border-r border-b p-2 last:border-r-0",
        isOutsideMonth && "bg-muted/30 text-muted-foreground",
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full font-medium text-xs",
            day.isToday && "bg-primary text-primary-foreground",
          )}
        >
          {day.dayLabel}
        </span>
      </div>
      <div className="space-y-1">
        {activities.map((activity) => (
          <ActivityCard
            activity={activity}
            key={`${activity.name}-${activity.startAt}`}
          />
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: ActivityListItem }) {
  return (
    <article className="rounded-md border bg-card px-2 py-1.5 text-card-foreground shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <h2 className="line-clamp-1 font-medium text-xs">{activity.name}</h2>
        <span className="shrink-0 text-[11px] text-muted-foreground">
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
          {formatDuration(activity.durationSeconds)}
        </span>
        {activity.averageHeartRateBeatsPerMinute ? (
          <span className="inline-flex items-center gap-1">
            <HeartPulseIcon className="size-3" />
            {activity.averageHeartRateBeatsPerMinute}
          </span>
        ) : null}
      </div>
    </article>
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

function formatSummaryDuration(durationSeconds: number) {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatElevation(elevationMeters: number) {
  return `${Math.round(elevationMeters)} m`;
}

export { ActivityCalendar };
