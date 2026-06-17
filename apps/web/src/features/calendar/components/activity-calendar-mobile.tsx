import type {
  ActivityListItem,
  ActivitySummary,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
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
  formatDurationClock,
  formatDurationCompact,
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
    <div className="grid gap-3 p-3">
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
    <span className="absolute top-5 left-[-1.08rem] size-2.5 rounded-full border-2 border-background bg-primary" />
  );
}

function formatElevation(elevationMeters: number) {
  return `${Math.round(elevationMeters)} m`;
}

export { ActivityCalendarMobile };
