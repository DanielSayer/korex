import type {
  ActivityListItem,
  ActivitySummary,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { Link } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
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
import { RouteAccent, SectionLabel } from "@/components/brand";
import { ErrorMessage } from "@/components/error-message";
import {
  formatDistance,
  formatDistanceValue,
  formatDurationClock,
  formatDurationCompact,
  formatMeters,
} from "@/utils/formatters";
import { getCalendarAgendaItems } from "../utils/calendar-month";

type ActivityCalendarMobileProps = {
  activities: ActivityListItem[];
  isError: boolean;
  isFetching: boolean;
  isPending: boolean;
  monthGrid: { monthLabel: string };
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  onToday: () => void;
  summaries: ActivitySummary[];
  visibleMonth: Date;
};

function ActivityCalendarMobile({
  activities,
  isError,
  isFetching,
  isPending,
  monthGrid,
  onNextMonth,
  onPreviousMonth,
  onToday,
  summaries,
  visibleMonth,
}: ActivityCalendarMobileProps) {
  const agendaItems = useMemo(
    () => getCalendarAgendaItems({ activities, summaries, visibleMonth }),
    [activities, summaries, visibleMonth],
  );

  return (
    <div className="flex flex-col gap-7 p-4">
      <MobileCalendarHeader
        monthLabel={monthGrid.monthLabel}
        onNextMonth={onNextMonth}
        onPreviousMonth={onPreviousMonth}
        onToday={onToday}
      />
      {isError ? (
        <ErrorMessage message="Could not load activities." variant="banner" />
      ) : null}
      {isFetching ? (
        <div
          className="inline-flex items-center gap-2 text-muted-foreground text-sm"
          aria-live="polite"
        >
          <Loader2Icon className="size-4 animate-spin" />
          Loading activities
        </div>
      ) : null}
      {isPending ? (
        <div className="flex flex-col gap-7" aria-hidden="true">
          <div className="h-24 animate-pulse rounded-3xl bg-muted/50" />
          <div className="h-32 animate-pulse rounded-3xl bg-muted/50" />
          <div className="h-24 animate-pulse rounded-3xl bg-muted/50" />
        </div>
      ) : agendaItems.length === 0 ? (
        <CalendarEmptyState />
      ) : (
        <div className="relative flex flex-col gap-7 pl-4 before:absolute before:top-2 before:bottom-2 before:left-1 before:w-px before:bg-border">
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
    <header className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Calendar
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">
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
    <section className="relative">
      <TimelineDot />
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <SectionLabel>Training Week</SectionLabel>
        <span className="font-display text-muted-foreground text-sm">
          {format(weekStartDate, "MMM d")} –{" "}
          {format(addDays(weekStartDate, 6), "MMM d")}
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border/30">
        <MobileSummaryMetric
          icon={<RouteIcon />}
          label="Distance"
          unit="km"
          value={formatDistanceValue(item.summary.distanceMeters)}
        />
        <MobileSummaryMetric
          icon={<ClockIcon />}
          label="Time"
          value={formatDurationCompact(item.summary.durationSeconds)}
        />
        <MobileSummaryMetric
          icon={<MountainIcon />}
          label="Gain"
          value={formatMeters(item.summary.totalElevationGainMeters)}
        />
      </div>
    </section>
  );
}

function MobileSummaryMetric({
  icon,
  label,
  unit,
  value,
}: {
  icon: ReactNode;
  label: string;
  unit?: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-2 text-center first:pl-0 last:pr-0">
      <span className="flex items-center gap-1 text-muted-foreground">
        <span className="[&>svg]:size-3.5">{icon}</span>
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </span>
      <p className="font-display text-xl tabular-nums leading-none">
        {value}
        {unit ? (
          <span className="ml-1 font-medium font-sans text-muted-foreground text-sm">
            {unit}
          </span>
        ) : null}
      </p>
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
    <section className="relative">
      <TimelineDot />
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-sm">{format(item.date, "EEEE")}</h2>
        <span className="font-display text-muted-foreground text-sm">
          {format(item.date, "MMM d")}
        </span>
      </div>
      <ol className="flex flex-col">
        {item.activities.map((activity) => (
          <li key={activity.id}>
            <Link
              to="/activity/$activityId"
              params={{ activityId: String(activity.id) }}
              className="block py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="line-clamp-1 font-medium text-sm">
                    {activity.name}
                  </span>
                  <span className="shrink-0 font-display text-sm tabular-nums">
                    {formatDistance(activity.distanceMeters)}
                  </span>
                </span>
                <span className="block text-muted-foreground text-xs">
                  {formatDurationClock(activity.durationSeconds)}
                  {activity.averageHeartRateBeatsPerMinute
                    ? ` · ${activity.averageHeartRateBeatsPerMinute} bpm`
                    : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CalendarEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <img
        alt="An empty winding trail cresting a small hill with a single route waypoint marker"
        className="h-20 w-auto opacity-90"
        src="/brand/empty-trail.svg"
      />
      <p className="text-muted-foreground text-sm">
        Nothing logged this month. Your trail starts here.
      </p>
    </div>
  );
}

function TimelineDot() {
  return (
    <span className="absolute top-1.5 left-[-1.08rem] size-2.5 rounded-full border-2 border-background bg-primary" />
  );
}

export { ActivityCalendarMobile };
