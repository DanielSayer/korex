import type { RecentActivity } from "@korex/api/modules/activities/activities.types";
import { Link } from "@tanstack/react-router";
import { ClockIcon, HeartPulseIcon, RouteIcon } from "lucide-react";
import {
  formatActivityDate,
  formatDistance,
  formatDuration,
} from "../utils/activity-formatters";
import { buildRoutePreviewPath } from "../utils/route-preview";

type RunCardProps = {
  run: RecentActivity;
};

function RunCard({ run }: RunCardProps) {
  return (
    <Link
      to="/activity/$activityId"
      params={{ activityId: String(run.id) }}
      className="group block min-w-0 overflow-hidden rounded-lg border transition-colors hover:border-primary/60"
    >
      <MapPreview run={run} />
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="line-clamp-1 font-medium text-sm">{run.name}</h4>
          <span className="shrink-0 text-muted-foreground text-xs">
            {formatActivityDate(run.startAt)}
          </span>
        </div>
        <RunMetrics run={run} />
      </div>
    </Link>
  );
}

function RunMetrics({ run }: RunCardProps) {
  return (
    <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-muted-foreground text-sm">
      <span className="inline-flex items-center gap-1.5">
        <RouteIcon className="size-3.5" />
        {formatDistance(run.distanceMeters)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ClockIcon className="size-3.5" />
        {formatDuration(run.durationSeconds)}
      </span>
      {run.averageHeartRateBeatsPerMinute ? (
        <span className="inline-flex items-center gap-1.5">
          <HeartPulseIcon className="size-3.5" />
          {run.averageHeartRateBeatsPerMinute} bpm
        </span>
      ) : null}
    </div>
  );
}

function MapPreview({ run }: RunCardProps) {
  const path = buildRoutePreviewPath(run.map?.coordinates);

  return (
    <div className="relative h-28 overflow-hidden bg-muted/30 text-muted-foreground">
      <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-size-[18px_18px] opacity-35" />
      <svg
        aria-label={path ? "Activity route preview" : "No route available"}
        className="absolute inset-0 size-full"
        role="img"
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
          <RouteIcon className="translate-x-8 translate-y-5" />
        )}
      </svg>
    </div>
  );
}

export { RunCard };
