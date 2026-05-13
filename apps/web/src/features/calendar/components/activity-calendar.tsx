import type { ActivityListItem } from "@korex/api/modules/activities/activities.types";
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
  RouteIcon,
} from "lucide-react";
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
  const activities = activitiesQuery.data ?? [];
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
        <ErrorMessage
          message="Could not load activities."
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive"
        />
      ) : null}
      <div className="relative grid flex-1">
        <MonthGrid
          activities={activities}
          days={monthGrid.days}
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
  visibleMonth,
}: {
  activities: ActivityListItem[];
  days: CalendarDay[];
  visibleMonth: Date;
}) {
  const activitiesByDay = useMemo(
    () => groupActivitiesByDay(activities),
    [activities],
  );

  return (
    <div className="grid flex-1 grid-rows-[auto_1fr] overflow-hidden rounded-lg border bg-background">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {weekDayLabels.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center font-medium text-muted-foreground text-xs"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid auto-rows-fr grid-cols-7">
        {days.map((day) => (
          <CalendarCell
            activities={activitiesByDay.get(getActivityDayKey(day.date)) ?? []}
            day={day}
            key={day.date.toISOString()}
            visibleMonth={visibleMonth}
          />
        ))}
      </div>
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
        "min-h-28 overflow-hidden border-border border-r border-b p-2 last:border-r-0",
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

export { ActivityCalendar };
