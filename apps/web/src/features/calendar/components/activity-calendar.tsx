import type {
  ActivityListItem,
  ActivitySummary,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { cn } from "@korex/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
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
import { PageHeader, PageLayout } from "@/components/page-layout";
import { useIsMobileViewport } from "@/components/responsive";
import {
  formatDistance,
  formatDurationClock,
  formatDurationCompact,
} from "@/utils/formatters";
import { orpc } from "@/utils/orpc";
import {
  type CalendarDay,
  getActivityDayKey,
  getCalendarAgendaItems,
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
  const isMobileViewport = useIsMobileViewport();
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

  if (isMobileViewport) {
    return (
      <ActivityCalendarMobile
        activities={activities}
        isError={activitiesQuery.isError}
        isFetching={activitiesQuery.isFetching}
        isPending={activitiesQuery.isPending}
        monthLabel={monthGrid.monthLabel}
        onNextMonth={() => onMonthChange(addMonths(visibleMonth, 1))}
        onPreviousMonth={() => onMonthChange(subMonths(visibleMonth, 1))}
        onToday={() => onMonthChange(new Date())}
        summaries={summaries}
        visibleMonth={visibleMonth}
      />
    );
  }

  return (
    <PageLayout>
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
    </PageLayout>
  );
}

function ActivityCalendarMobile({
  activities,
  isError,
  isFetching,
  isPending,
  monthLabel,
  onNextMonth,
  onPreviousMonth,
  onToday,
  summaries,
  visibleMonth,
}: {
  activities: ActivityListItem[];
  isError: boolean;
  isFetching: boolean;
  isPending: boolean;
  monthLabel: string;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  onToday: () => void;
  summaries: ActivitySummary[];
  visibleMonth: Date;
}) {
  const agendaItems = useMemo(
    () => getCalendarAgendaItems({ activities, summaries, visibleMonth }),
    [activities, summaries, visibleMonth],
  );

  return (
    <div className="grid gap-3 p-3">
      <MobileCalendarHeader
        monthLabel={monthLabel}
        onNextMonth={onNextMonth}
        onPreviousMonth={onPreviousMonth}
        onToday={onToday}
      />
      {isError ? (
        <ErrorMessage message="Could not load activities." variant="banner" />
      ) : null}
      {isFetching ? (
        <div
          className="inline-flex items-center rounded-lg border bg-background px-3 py-2 text-muted-foreground text-sm"
          aria-live="polite"
        >
          <Loader2Icon className="mr-2 size-4 animate-spin" />
          Loading activities
        </div>
      ) : null}
      {isPending ? (
        <div className="grid gap-3" aria-hidden="true">
          <div className="h-24 animate-pulse rounded-xl border bg-card" />
          <div className="h-32 animate-pulse rounded-xl border bg-card" />
          <div className="h-24 animate-pulse rounded-xl border bg-card" />
        </div>
      ) : agendaItems.length === 0 ? (
        <section className="rounded-xl border border-border/70 bg-card p-4 text-muted-foreground text-sm">
          No Activities in this month.
        </section>
      ) : (
        <div className="relative grid gap-3 pl-4 before:absolute before:top-2 before:bottom-2 before:left-1 before:w-px before:bg-border">
          {agendaItems.map((item) =>
            item.type === "summary" ? (
              <MobileWeekSummaryItem item={item} key={item.id} />
            ) : (
              <MobileActivityDayItem item={item} key={item.id} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function MobileCalendarHeader({
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
    <header className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-primary text-xs uppercase">
            Calendar
          </p>
          <h1 className="mt-1 truncate font-semibold text-2xl tracking-tight">
            {monthLabel}
          </h1>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Previous month"
          onClick={onPreviousMonth}
        >
          <ChevronLeftIcon />
        </Button>
        <div className="text-center font-medium text-muted-foreground text-sm">
          Activity timeline
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
      </div>
    </header>
  );
}

function MobileWeekSummaryItem({
  item,
}: {
  item: Extract<
    ReturnType<typeof getCalendarAgendaItems>[number],
    { type: "summary" }
  >;
}) {
  const weekStartDate = new Date(item.summary.weekStartDate);

  return (
    <section className="relative rounded-xl border border-border/70 bg-muted/35 p-3">
      <TimelineDot />
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-primary text-xs uppercase">
          Training Week
        </h2>
        <span className="text-muted-foreground text-xs">
          {format(weekStartDate, "MMM d")}
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        <MobileSummaryMetric
          icon={<RouteIcon />}
          label="Distance"
          value={formatDistance(item.summary.distanceMeters)}
        />
        <MobileSummaryMetric
          icon={<ClockIcon />}
          label="Time"
          value={formatDurationCompact(item.summary.durationSeconds)}
        />
        <MobileSummaryMetric
          icon={<MountainIcon />}
          label="Gain"
          value={formatElevation(item.summary.totalElevationGainMeters)}
        />
      </dl>
    </section>
  );
}

function MobileSummaryMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border/60 bg-background p-2">
      <dt className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <span className="[&>svg]:size-3.5">{icon}</span>
        <span className="truncate">{label}</span>
      </dt>
      <dd className="mt-1 truncate font-semibold text-sm">{value}</dd>
    </div>
  );
}

function MobileActivityDayItem({
  item,
}: {
  item: Extract<
    ReturnType<typeof getCalendarAgendaItems>[number],
    { type: "activityDay" }
  >;
}) {
  return (
    <section className="relative rounded-xl border border-border/70 bg-card p-3">
      <TimelineDot />
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-sm">{format(item.date, "EEEE")}</h2>
        <span className="text-muted-foreground text-xs">
          {format(item.date, "MMM d")}
        </span>
      </div>
      <div className="grid divide-y divide-border/70">
        {item.activities.map((activity) => (
          <MobileActivityLink activity={activity} key={activity.id} />
        ))}
      </div>
    </section>
  );
}

function MobileActivityLink({ activity }: { activity: ActivityListItem }) {
  return (
    <Link
      to="/activity/$activityId"
      params={{ activityId: String(activity.id) }}
      className="grid gap-1 py-2 first:pt-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 font-medium text-sm">{activity.name}</h3>
        <span className="shrink-0 text-muted-foreground text-xs">
          {format(new Date(activity.startAt), "HH:mm")}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
        <span className="inline-flex items-center gap-1">
          <RouteIcon className="size-3.5" />
          {formatDistance(activity.distanceMeters)}
        </span>
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="size-3.5" />
          {formatDurationClock(activity.durationSeconds)}
        </span>
        {activity.averageHeartRateBeatsPerMinute ? (
          <span className="inline-flex items-center gap-1">
            <HeartPulseIcon className="size-3.5" />
            {activity.averageHeartRateBeatsPerMinute} bpm
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function TimelineDot() {
  return (
    <span className="absolute top-5 -left-[1.08rem] size-2.5 rounded-full border-2 border-background bg-primary" />
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
    <PageHeader
      description="Activities by training week."
      title="Calendar"
      actions={
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
      }
    />
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
      className="block rounded-md border bg-card px-2 py-1.5 text-card-foreground shadow-xs transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
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

export { ActivityCalendar };
