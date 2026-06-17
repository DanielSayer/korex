import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { Card, CardContent } from "@korex/ui/components/card";
import { Separator } from "@korex/ui/components/separator";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CalendarIcon } from "lucide-react";
import type { ReactNode } from "react";
import { QueryRenderer } from "@/components/query-renderer";
import { useIsMobileViewport } from "@/components/responsive";
import { TrainingNotesSection } from "@/features/training-notes/components/training-notes-section";
import {
  formatActivityDateTime,
  formatDistanceValue,
  formatDurationClock,
  formatPaceFromSpeed,
} from "@/utils/formatters";
import { orpc } from "@/utils/orpc";
import { ActivityDetailHeader } from "./activity-detail/activity-detail-header";
import { ActivityDetailSkeleton } from "./activity-detail/activity-detail-skeleton";
import { ActivityEquipmentCard } from "./activity-detail/activity-equipment-card";
import { ActivityLapsCard } from "./activity-detail/activity-laps-card";
import { ActivityRouteMap } from "./activity-detail/activity-route-map";
import { ActivityStats } from "./activity-detail/activity-stats";
import { ActivityStreamCharts } from "./activity-detail/activity-stream-charts";
import { BestEffortsCard } from "./activity-detail/best-efforts-card";
import { HeartRateZonesCard } from "./activity-detail/heart-rate-zones-card";

type ActivityDetailPageProps = {
  activityId: string;
};

function ActivityDetailPage({ activityId }: ActivityDetailPageProps) {
  const isMobileViewport = useIsMobileViewport();
  const activityQuery = useQuery(
    orpc.activities.summary.queryOptions({ input: { activityId } }),
  );

  return (
    <QueryRenderer
      error={(error) => (
        <ActivityDetailMessage
          message={`Failed to load activity: ${getErrorMessage(error)}`}
          tone="error"
        />
      )}
      loading={<ActivityDetailSkeleton />}
      query={activityQuery}
    >
      {(summary) =>
        summary ? (
          isMobileViewport ? (
            <ActivityDetailMobileView
              activityId={activityId}
              summary={summary}
            />
          ) : (
            <ActivityDetailDesktopView
              activityId={activityId}
              summary={summary}
            />
          )
        ) : (
          <ActivityDetailMessage message="This activity could not be found." />
        )
      }
    </QueryRenderer>
  );
}

function ActivityDetailDesktopView({
  activityId,
  summary,
}: {
  activityId: string;
  summary: ActivityDetailSummary;
}) {
  const streamsQuery = useQuery(
    orpc.activities.streams.queryOptions({
      input: { activityId: summary.activity.id },
    }),
  );

  return (
    <div className="space-y-6">
      <ActivityDetailHeader activity={summary.activity} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="min-h-96 lg:col-span-2">
          <ActivityRouteMap map={summary.map} />
        </div>
        <div className="flex flex-col justify-between rounded-xl border bg-card p-6">
          <ActivityStats summary={summary} />
          <Separator className="my-6" />
          <BestEffortsCard efforts={summary.bestEfforts} />
          <Separator className="my-6" />
          <ActivityEquipmentCard activityId={activityId} summary={summary} />
        </div>
      </div>

      <ActivityLapsCard laps={summary.laps} />
      <TrainingNotesSection activityId={summary.activity.id} type="activity" />
      <HeartRateZonesCard summary={summary} />
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
    </div>
  );
}

function ActivityDetailMobileView({
  activityId,
  summary,
}: {
  activityId: string;
  summary: ActivityDetailSummary;
}) {
  const streamsQuery = useQuery(
    orpc.activities.streams.queryOptions({
      input: { activityId: summary.activity.id },
    }),
  );

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

function ActivityStreamChartsSkeleton() {
  const skeletonChartKeys = ["heart-rate", "cadence", "pace", "elevation"];

  return (
    <section className="space-y-3">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 xl:grid-cols-2">
        {skeletonChartKeys.map((key) => (
          <div
            className="h-72 animate-pulse rounded-lg border bg-muted/30"
            key={key}
          />
        ))}
      </div>
    </section>
  );
}

function ActivityDetailMessage({
  message,
  tone = "muted",
}: {
  message: string;
  tone?: "error" | "muted";
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <p
          className={
            tone === "error"
              ? "text-destructive text-sm"
              : "text-muted-foreground text-sm"
          }
        >
          {message}
        </p>
        <Button variant="outline" render={<Link to="/dashboard" />}>
          <ArrowLeftIcon className="size-4" />
          Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function formatRoundedValue(value: number | null) {
  return value ? Math.round(value).toString() : "--";
}

export { ActivityDetailPage };
