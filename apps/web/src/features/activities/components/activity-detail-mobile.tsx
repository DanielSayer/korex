import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CalendarIcon } from "lucide-react";
import type { ReactNode } from "react";
import { QueryRenderer } from "@/components/query-renderer";
import { TrainingNotesSection } from "@/features/training-notes/components/training-notes-section";
import {
  formatActivityDateTime,
  formatDistanceValue,
  formatDurationClock,
  formatPaceFromSpeed,
} from "@/utils/formatters";
import { useActivityStreams } from "../hooks/use-activity-streams";
import { ActivityEquipmentCard } from "./activity-detail/activity-equipment-card";
import { ActivityLapsCard } from "./activity-detail/activity-laps-card";
import { ActivityRouteMap } from "./activity-detail/activity-route-map";
import { ActivityStreamCharts } from "./activity-detail/activity-stream-charts";
import { ActivityStreamChartsSkeleton } from "./activity-detail/activity-stream-charts-skeleton";
import { BestEffortsCard } from "./activity-detail/best-efforts-card";
import { HeartRateZonesCard } from "./activity-detail/heart-rate-zones-card";

type ActivityDetailMobileProps = {
  activityId: string;
  summary: ActivityDetailSummary;
};

function ActivityDetailMobile({
  activityId,
  summary,
}: ActivityDetailMobileProps) {
  const streamsQuery = useActivityStreams(summary.activity.id);

  return (
    <div className="bg-background text-foreground">
      <MobileActivityTopChrome activity={summary.activity} />
      <section className="h-92 min-h-0">
        <ActivityRouteMap
          className="rounded-none border-0"
          compactAttribution
          map={summary.map}
        />
      </section>

      <div>
        <MobileActivitySummaryPanel summary={summary} />

        <MobileActivitySection>
          <TrainingNotesSection
            activityId={summary.activity.id}
            type="activity"
          />
        </MobileActivitySection>

        <MobileActivitySection>
          <QueryRenderer
            error={null}
            loading={<ActivityStreamChartsSkeleton />}
            query={streamsQuery}
          >
            {(streams) =>
              streams ? (
                <ActivityStreamCharts streams={streams} summary={summary} />
              ) : null
            }
          </QueryRenderer>
        </MobileActivitySection>

        <MobileActivitySection>
          <BestEffortsCard efforts={summary.bestEfforts} />
        </MobileActivitySection>
        <MobileActivitySection>
          <HeartRateZonesCard summary={summary} />
        </MobileActivitySection>
        <MobileActivitySection title="Lap Details">
          <ActivityLapsCard compactMobile laps={summary.laps} />
        </MobileActivitySection>
        <MobileActivitySection>
          <ActivityEquipmentCard activityId={activityId} summary={summary} />
        </MobileActivitySection>
      </div>
    </div>
  );
}

function MobileActivitySummaryPanel({
  summary,
}: {
  summary: ActivityDetailSummary;
}) {
  const { activity, laps } = summary;
  const durationSeconds =
    activity.movingTimeSeconds ?? activity.elapsedTimeSeconds;
  const bestLap = laps
    .map((lap) => lap.averageSpeedMetersPerSecond)
    .filter((speed): speed is number => speed !== null && speed > 0)
    .sort((left, right) => right - left)[0];
  const metrics = [
    {
      label: "Activity Time",
      value: formatDurationClock(durationSeconds),
    },
    {
      label: "Avg Pace",
      unit: "/km",
      value: formatPaceFromSpeed(activity.averageSpeedMetersPerSecond),
    },
    {
      label: "Best Lap",
      unit: "/km",
      value: formatPaceFromSpeed(bestLap ?? null),
    },
    {
      label: "Average Heart Rate",
      unit: "bpm",
      value: formatRoundedValue(activity.averageHeartRateBeatsPerMinute),
    },
    {
      label: "Calories",
      unit: "kcal",
      value: formatRoundedValue(activity.energyKilocalories),
    },
    {
      label: "Elev Gain",
      unit: "m",
      value: formatRoundedValue(activity.totalElevationGainMeters),
    },
  ];

  return (
    <section className="rounded-t-xl bg-card px-3 pt-5 pb-4 text-card-foreground shadow-lg">
      <div className="mb-5">
        <div className="mt-4 flex items-end gap-2">
          <span className="font-semibold text-6xl tabular-nums leading-none">
            {formatDistanceValue(activity.distanceMeters)}
          </span>
          <span className="pb-1 font-semibold text-lg text-muted-foreground">
            km
          </span>
        </div>
        <p className="mt-1 text-muted-foreground text-sm">Distance</p>
      </div>

      <dl className="grid grid-cols-3 gap-x-4 gap-y-5 border-border border-t pt-5">
        {metrics.map((metric) => (
          <div className="min-w-0" key={metric.label}>
            <dt className="line-clamp-2 min-h-8 text-muted-foreground text-xs leading-tight">
              {metric.label}
            </dt>
            <dd className="mt-1 flex min-w-0 items-baseline gap-1">
              <span className="truncate font-semibold text-2xl tabular-nums leading-none">
                {metric.value}
              </span>
              {metric.unit ? (
                <span className="shrink-0 text-muted-foreground text-xs">
                  {metric.unit}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function MobileActivityTopChrome({
  activity,
}: {
  activity: ActivityDetailSummary["activity"];
}) {
  return (
    <header className="border-border border-b bg-background px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <Button
          aria-label="Back to dashboard"
          render={<Link to="/dashboard" />}
          size="sm"
          variant="outline"
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
        <div className="min-w-0">
          <h1 className="truncate font-semibold text-base leading-tight">
            {activity.name}
          </h1>
          <p className="mt-0.5 flex min-w-0 items-center gap-1 text-muted-foreground text-xs">
            <CalendarIcon className="size-3.5 shrink-0" />
            <span className="truncate">
              {formatActivityDateTime(activity.startAt)}
            </span>
          </p>
        </div>
        <span className="inline-flex h-6 items-center rounded-md border bg-secondary px-2 font-medium text-[10px] text-secondary-foreground uppercase">
          {activity.sportType}
        </span>
      </div>
      {activity.deviceName ? (
        <p className="mt-1 truncate pl-21 text-muted-foreground text-xs">
          {activity.deviceName}
        </p>
      ) : null}
    </header>
  );
}

function MobileActivitySection({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <section className="border-border border-t px-3 py-5">
      {title ? (
        <h2 className="mb-3 font-semibold text-lg uppercase tracking-tight">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

function formatRoundedValue(value: number | null) {
  return value ? Math.round(value).toString() : "--";
}

export { ActivityDetailMobile };
