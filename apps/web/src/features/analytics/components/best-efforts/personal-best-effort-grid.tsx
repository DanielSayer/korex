import type { PersonalBestEffort } from "@korex/api/modules/activities/activities.types";
import { formatDurationClock, formatShortDate } from "@/utils/formatters";
import {
  bestEffortDistanceCodes,
  bestEffortDistanceLabels,
} from "./best-effort-distance-options";

function PersonalBestEffortGrid({
  efforts,
}: {
  efforts: PersonalBestEffort[];
}) {
  if (efforts.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-muted-foreground text-sm">
        No personal best efforts yet.
      </div>
    );
  }

  const effortsByDistance = new Map(
    efforts.map((effort) => [effort.standardDistanceCode, effort]),
  );

  return (
    <div className="overflow-hidden rounded-lg border">
      {bestEffortDistanceCodes.map((standardDistanceCode) => {
        const effort = effortsByDistance.get(standardDistanceCode);

        return (
          <div
            className="grid min-h-16 grid-cols-[minmax(7rem,1fr)_auto] items-center gap-3 border-border border-b px-4 py-3 last:border-b-0 xl:inline-grid xl:w-1/3 xl:border-r xl:nth-[3n]:border-r-0 xl:nth-last-[-n+3]:border-b-0"
            key={standardDistanceCode}
          >
            <div className="min-w-0">
              <div className="truncate text-muted-foreground text-sm">
                {bestEffortDistanceLabels[standardDistanceCode]}
              </div>
              <div className="mt-0.5 truncate text-muted-foreground text-xs">
                {effort ? formatShortDate(effort.activityStartAt) : "No effort"}
              </div>
            </div>
            <div className="whitespace-nowrap text-right font-semibold text-xl tracking-tight">
              {formatDurationClock(effort?.durationSeconds ?? null)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { PersonalBestEffortGrid };
