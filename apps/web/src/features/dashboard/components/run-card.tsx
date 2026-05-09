import type { RecentActivity } from "@korex/api/modules/activities/activities.types";
import { ClockIcon, HeartPulseIcon, RouteIcon } from "lucide-react";
import {
  formatActivityDate,
  formatDistance,
  formatDuration,
} from "../utils/activity-formatters";

type RunCardProps = {
  run: RecentActivity;
};

function RunCard({ run }: RunCardProps) {
  return (
    <article className="group min-w-0 overflow-hidden rounded-lg border">
      <MapPlaceholder run={run} />
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="line-clamp-1 font-medium text-sm">{run.name}</h4>
          <span className="shrink-0 text-muted-foreground text-xs">
            {formatActivityDate(run.startAt)}
          </span>
        </div>
        <RunMetrics run={run} />
      </div>
    </article>
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

function MapPlaceholder({ run }: RunCardProps) {
  return (
    <div className="flex h-28 items-center justify-center bg-muted object-cover text-muted-foreground">
      <RouteIcon className="size-6" />
      <span className="sr-only">
        {run.map ? "Map preview unavailable" : "No map for this run"}
      </span>
    </div>
  );
}

export { RunCard };
