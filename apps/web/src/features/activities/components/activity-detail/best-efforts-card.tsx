import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { TrendingUpIcon } from "lucide-react";
import { SectionLabel } from "@/components/brand";
import { formatDurationClock } from "@/utils/formatters";
import {
  BEST_EFFORT_STANDARD_DISTANCE_CODES,
  DISTANCE_CONFIG,
  formatPace,
} from "./best-effort-formatters";
import { Medal } from "./medal";

type BestEffortsCardProps = {
  desktop?: boolean;
  efforts: ActivityDetailSummary["bestEfforts"];
};

function BestEffortsCard({ desktop = false, efforts }: BestEffortsCardProps) {
  const effortsByDistance = new Map(
    efforts.map((effort) => [effort.standardDistanceCode, effort]),
  );
  const hasAnyEffort = efforts.length > 0;

  if (desktop && hasAnyEffort) {
    return (
      <div>
        <SectionLabel>Activity best efforts</SectionLabel>
        <p className="mt-2 max-w-md text-muted-foreground text-sm">
          Fastest standard-distance efforts found in this Activity.
        </p>
        <div className="mt-5 divide-y divide-border/50 border-border/50 border-y">
          {BEST_EFFORT_STANDARD_DISTANCE_CODES.map((distanceCode) => {
            const effort = effortsByDistance.get(distanceCode);

            if (!effort) {
              return null;
            }

            return (
              <div
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-6 py-3"
                key={distanceCode}
              >
                <span className="font-medium text-sm">
                  {DISTANCE_CONFIG[distanceCode].long}
                </span>
                <span className="font-display text-lg tabular-nums">
                  {formatDurationClock(effort.durationSeconds)}
                </span>
                <span className="min-w-16 text-right text-muted-foreground text-xs tabular-nums">
                  {formatPace(effort.distanceMeters, effort.durationSeconds)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionLabel>Activity best efforts</SectionLabel>

      {!hasAnyEffort ? (
        <div className="flex flex-col items-start gap-2 py-6 text-muted-foreground">
          <TrendingUpIcon className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            No best efforts recorded yet. Complete some activities to see your
            records here.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4">
          {BEST_EFFORT_STANDARD_DISTANCE_CODES.map((distanceCode) => {
            const effort = effortsByDistance.get(distanceCode);
            const config = DISTANCE_CONFIG[distanceCode];

            if (!effort) {
              return null;
            }

            return (
              <div
                key={distanceCode}
                className="flex flex-col items-center gap-1.5"
              >
                <Medal
                  color={config.color}
                  glow={config.glow}
                  label={config.short}
                  ring={config.ring}
                />
                <span className="font-display text-sm tabular-nums leading-tight">
                  {formatDurationClock(effort.durationSeconds)}
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {formatPace(effort.distanceMeters, effort.durationSeconds)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { BestEffortsCard };
