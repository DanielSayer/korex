import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { TrendingUpIcon, TrophyIcon } from "lucide-react";
import { formatDurationClock } from "@/utils/formatters";
import {
  BEST_EFFORT_STANDARD_DISTANCE_CODES,
  DISTANCE_CONFIG,
  formatPace,
} from "./best-effort-formatters";
import { Medal } from "./medal";

type BestEffortsCardProps = {
  efforts: ActivityDetailSummary["bestEfforts"];
};

function BestEffortsCard({ efforts }: BestEffortsCardProps) {
  const effortsByDistance = new Map(
    efforts.map((effort) => [effort.standardDistanceCode, effort]),
  );
  const hasAnyEffort = efforts.length > 0;

  return (
    <div>
      <p className="mb-6 flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase">
        <TrophyIcon className="size-4 text-yellow-500" />
        Best Efforts
      </p>

      {!hasAnyEffort ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <TrendingUpIcon className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            No best efforts recorded yet. Complete some activities to see your
            records here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4">
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
                <span className="font-mono font-semibold text-sm tabular-nums leading-tight">
                  {formatDurationClock(effort.durationSeconds)}
                </span>
                <span className="font-mono text-muted-foreground text-xs tabular-nums">
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
