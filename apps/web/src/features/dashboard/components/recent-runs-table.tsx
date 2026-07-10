import type { RecentActivity } from "@korex/api/modules/activities/activities.types";
import { Link } from "@tanstack/react-router";
import {
  ChevronRightIcon,
  MessageSquareTextIcon,
  RouteIcon,
} from "lucide-react";
import { SectionLabel } from "@/components/brand";
import {
  formatDistance,
  formatDurationClock,
  formatPaceSeconds,
} from "@/utils/formatters";
import { buildRoutePreviewPath } from "../utils/route-preview";

type RecentRunsTableProps = {
  isLoading: boolean;
  runs: RecentActivity[];
};

function RecentRunsTable({ isLoading, runs }: RecentRunsTableProps) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4 border-border border-b pb-4">
        <div>
          <SectionLabel>Recent field notes</SectionLabel>
          <h2 className="mt-2 font-display font-medium text-2xl">
            Your latest runs
          </h2>
        </div>
        <Link
          className="inline-flex items-center gap-1 text-muted-foreground text-xs underline underline-offset-4 transition-colors hover:text-foreground"
          to="/calendar"
        >
          View all Activities <ChevronRightIcon className="size-3.5" />
        </Link>
      </div>
      <div>
        {isLoading ? (
          <EmptyPanel label="Reading recent Activities…" />
        ) : runs.length === 0 ? (
          <EmptyPanel label="Your next Activity will start the field notes." />
        ) : (
          runs.slice(0, 5).map((run) => <ActivityRow key={run.id} run={run} />)
        )}
      </div>
    </section>
  );
}

function ActivityRow({ run }: { run: RecentActivity }) {
  const pace = getPace(run);

  return (
    <Link
      className="group grid gap-4 border-border border-b py-4 transition-colors last:border-b-0 hover:bg-muted/25 lg:grid-cols-[5rem_minmax(10rem,1fr)_repeat(4,minmax(4.75rem,0.48fr))_1.5rem] lg:items-center"
      params={{ activityId: String(run.id) }}
      to="/activity/$activityId"
    >
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
      <ChevronRightIcon className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 lg:block" />
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
    <div className="relative h-14 overflow-hidden rounded-xl bg-muted/60 text-journal-route">
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
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
        ) : (
          <RouteIcon className="translate-x-7 translate-y-4 text-muted-foreground" />
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

function formatRunDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export { RecentRunsTable };
