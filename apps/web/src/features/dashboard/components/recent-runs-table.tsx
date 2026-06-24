import type { RecentActivity } from "@korex/api/modules/activities/activities.types";
import { Link } from "@tanstack/react-router";
import {
  ChevronRightIcon,
  MessageSquareTextIcon,
  RouteIcon,
} from "lucide-react";
import { formatDistance, formatDurationClock } from "@/utils/formatters";
import { SectionLabel, WaypointDot } from "@/components/brand";
import { buildRoutePreviewPath } from "../utils/route-preview";

type RecentRunsTableProps = {
  isLoading: boolean;
  runs: RecentActivity[];
};

function RecentRunsTable({ isLoading, runs }: RecentRunsTableProps) {
  return (
    <section className="relative">
      <div className="mb-3 flex items-center justify-between gap-4">
        <SectionLabel>Recent</SectionLabel>
      </div>
      <div className="relative overflow-hidden pl-8">
        <div className="absolute top-6 bottom-8 left-2.5 w-px bg-border" />
        {isLoading ? (
          <EmptyPanel label="Loading recent runs..." />
        ) : runs.length === 0 ? (
          <EmptyPanel label="No recent runs yet." />
        ) : (
          runs.slice(0, 5).map((run) => <RunRow key={run.id} run={run} />)
        )}
      </div>
      <Link
        className="mt-5 inline-flex w-full items-center justify-center gap-1 font-medium text-primary text-sm"
        to="/calendar"
      >
        View all runs <ChevronRightIcon className="size-4" />
      </Link>
    </section>
  );
}

function RunRow({ run }: { run: RecentActivity }) {
  const pace = getPace(run);

  return (
    <Link
      className="relative grid gap-3 border-border/70 border-b py-3 transition-colors last:border-b-0 hover:bg-muted/20 lg:grid-cols-[92px_minmax(160px,1fr)_repeat(4,minmax(76px,0.48fr))] lg:items-center"
      params={{ activityId: String(run.id) }}
      to="/activity/$activityId"
    >
      <WaypointDot className="absolute top-1/2 -left-7.5 -translate-y-1/2 bg-background ring-4 ring-background" filled={false} />
      <MapPreview run={run} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate font-display font-medium">{run.name}</h3>
          {run.noteCount > 0 ? (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-muted-foreground text-xs"
              title={`${run.noteCount} Training Notes`}
            >
              <MessageSquareTextIcon className="size-3" />
              {run.noteCount}
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {formatRunDate(run.startAt)}
        </p>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:contents">
        <RunRowMetric
          label="Distance"
          value={formatDistance(run.distanceMeters)}
        />
        <RunRowMetric
          label="Time"
          value={formatDurationClock(run.durationSeconds ?? null)}
        />
        <RunRowMetric label="Avg pace" unit="/km" value={pace ?? "--"} />
        <RunRowMetric
          label="Avg HR"
          unit="bpm"
          value={run.averageHeartRateBeatsPerMinute?.toFixed(0) ?? "--"}
        />
      </div>
    </Link>
  );
}

function RunRowMetric({
  label,
  unit,
  value,
}: {
  label: string;
  unit?: string;
  value: string;
}) {
  const [metricValue, metricUnit] = value.split(" ");

  return (
    <div className="min-w-0 overflow-hidden">
      <p className="font-display text-lg tabular-nums">
        {metricValue}
        <span className="ml-1 font-normal text-muted-foreground text-xs">
          {unit ?? metricUnit}
        </span>
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

function MapPreview({ run }: { run: RecentActivity }) {
  const path = buildRoutePreviewPath(run.map?.coordinates);

  return (
    <div className="relative h-16 overflow-hidden rounded-md border border-border/70 bg-muted/20">
      <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-size-[18px_18px] opacity-35" />
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full"
        viewBox="0 0 88 64"
      >
        {path ? (
          <path
            d={path}
            fill="none"
            stroke="var(--primary)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
        ) : (
          <RouteIcon className="translate-x-8 translate-y-5 text-muted-foreground" />
        )}
      </svg>
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="grid min-h-32 place-items-center text-muted-foreground text-sm">
      {label}
    </div>
  );
}

function getPace(run: RecentActivity) {
  if (!run.distanceMeters || !run.durationSeconds) {
    return null;
  }

  return formatPaceSeconds(run.durationSeconds / (run.distanceMeters / 1000));
}

function formatPaceSeconds(seconds: number) {
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatRunDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export { RecentRunsTable };
