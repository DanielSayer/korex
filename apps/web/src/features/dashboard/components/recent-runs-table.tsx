import type { RecentActivity } from "@korex/api/modules/activities/activities.types";
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, RouteIcon } from "lucide-react";
import { formatDistance, formatDurationClock } from "@/utils/formatters";

type RecentRunsTableProps = {
  isLoading: boolean;
  runs: RecentActivity[];
};

function RecentRunsTable({ isLoading, runs }: RecentRunsTableProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-lg">Last 5 Runs</h2>
        <Link
          className="inline-flex items-center gap-1 font-medium text-primary text-sm"
          to="/calendar"
        >
          View all runs <ChevronRightIcon className="size-4" />
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border">
        {isLoading ? (
          <EmptyPanel label="Loading recent runs..." />
        ) : runs.length === 0 ? (
          <EmptyPanel label="No recent runs yet." />
        ) : (
          runs.slice(0, 5).map((run) => <RunRow key={run.id} run={run} />)
        )}
      </div>
    </section>
  );
}

function RunRow({ run }: { run: RecentActivity }) {
  const pace = getPace(run);

  return (
    <Link
      className="grid gap-3 border-b p-3 last:border-b-0 hover:bg-muted/40 md:grid-cols-[72px_minmax(160px,1fr)_repeat(4,minmax(80px,0.48fr))] md:items-center"
      params={{ activityId: String(run.id) }}
      to="/activity/$activityId"
    >
      <MapPreview run={run} />
      <div className="min-w-0">
        <h3 className="truncate font-semibold">{run.name}</h3>
        <p className="text-muted-foreground text-sm">
          {formatRunDate(run.startAt)}
        </p>
      </div>
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
    <div className="min-w-0">
      <p className="font-semibold text-lg tabular-nums">
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
  const path = buildMapPath(run);

  return (
    <div className="relative h-16 overflow-hidden rounded-md border bg-muted/20">
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:18px_18px]" />
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

function buildMapPath(run: RecentActivity) {
  const coordinates = run.map?.coordinates;
  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  const sampled = coordinates.filter(
    (_, index) =>
      index % Math.max(1, Math.floor(coordinates.length / 24)) === 0,
  );
  const latitudes = sampled.map((point) => point.latitude);
  const longitudes = sampled.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeRange = maxLatitude - minLatitude || 1;
  const longitudeRange = maxLongitude - minLongitude || 1;

  return sampled
    .map((point, index) => {
      const x = 8 + ((point.longitude - minLongitude) / longitudeRange) * 72;
      const y = 8 + (1 - (point.latitude - minLatitude) / latitudeRange) * 48;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
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
