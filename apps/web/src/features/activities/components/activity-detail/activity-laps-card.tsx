import type { ActivityLapSummary } from "@korex/api/modules/activities/activities.types";
import { SectionLabel } from "@/components/brand";
import { cn } from "@/lib/utils";
import { formatDurationClock, formatPaceFromSpeed } from "@/utils/formatters";
import { MetricValue } from "./metric-value";

type ActivityLapsCardProps = {
  compactMobile?: boolean;
  desktop?: boolean;
  laps: ActivityLapSummary[];
};

function ActivityLapsCard({
  compactMobile = false,
  desktop = false,
  laps,
}: ActivityLapsCardProps) {
  if (laps.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className={cn(compactMobile && "hidden md:block")}>
        <SectionLabel>Laps</SectionLabel>
      </div>

      <MobileLapsTable laps={laps} />

      <div
        className={cn(
          "hidden overflow-x-auto border-y md:block",
          desktop && "border-border/50",
        )}
      >
        <table className="w-full min-w-280 text-sm">
          <thead className={cn(desktop && "text-muted-foreground")}>
            <tr className="border-b text-muted-foreground">
              {[
                ["Lap", "text-left"],
                ["Distance", "text-right"],
                ["Moving", "text-right"],
                ["Elapsed", "text-right"],
                ["Start", "text-right"],
                ["End", "text-right"],
                ["Avg Speed", "text-right"],
                ["Max Speed", "text-right"],
                ["Avg HR", "text-right"],
                ["Max HR", "text-right"],
                ["Cadence", "text-right"],
                ["Stride", "text-right"],
                ["Elevation", "text-right"],
              ].map(([label, alignment]) => (
                <th
                  className={cn(
                    "px-3 py-3 font-medium",
                    alignment,
                    desktop &&
                      "font-display text-[10px] uppercase tracking-[0.14em]",
                  )}
                  key={label}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn(desktop && "font-display tabular-nums")}>
            {laps.map((lap) => (
              <tr
                key={lap.id}
                className="border-border/40 border-b last:border-0"
              >
                <td className="px-3 py-2 font-medium">{lap.index + 1}</td>
                <td className="px-3 py-2 text-right">
                  <MetricValue
                    align="right"
                    unit="km"
                    value={formatDistanceValue(lap.distanceMeters)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  {formatDurationClock(lap.movingTimeSeconds)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatDurationClock(lap.elapsedTimeSeconds)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatDurationClock(lap.startTimeSeconds)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatDurationClock(lap.endTimeSeconds)}
                </td>
                <td className="px-3 py-2 text-right">
                  <MetricValue
                    align="right"
                    unit="km/h"
                    value={formatSpeedValue(lap.averageSpeedMetersPerSecond)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <MetricValue
                    align="right"
                    unit="km/h"
                    value={formatSpeedValue(lap.maxSpeedMetersPerSecond)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <MetricValue
                    align="right"
                    unit="bpm"
                    value={formatRoundedValue(
                      lap.averageHeartRateBeatsPerMinute,
                    )}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <MetricValue
                    align="right"
                    unit="bpm"
                    value={formatRoundedValue(lap.maxHeartRateBeatsPerMinute)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <MetricValue
                    align="right"
                    unit="spm"
                    value={formatRoundedValue(lap.averageCadenceStepsPerMinute)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <MetricValue
                    align="right"
                    unit="m"
                    value={formatStrideLength(lap.averageStrideLengthMeters)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <MetricValue
                    align="right"
                    unit="m"
                    value={formatRoundedValue(lap.totalElevationGainMeters)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MobileLapsTable({ laps }: { laps: ActivityLapSummary[] }) {
  const totals = laps.reduce(
    (total, lap) => ({
      distanceMeters: total.distanceMeters + (lap.distanceMeters ?? 0),
      movingTimeSeconds: total.movingTimeSeconds + (lap.movingTimeSeconds ?? 0),
      heartRateTotal:
        total.heartRateTotal + (lap.averageHeartRateBeatsPerMinute ?? 0),
      heartRateCount:
        total.heartRateCount +
        (lap.averageHeartRateBeatsPerMinute === null ? 0 : 1),
    }),
    {
      distanceMeters: 0,
      heartRateCount: 0,
      heartRateTotal: 0,
      movingTimeSeconds: 0,
    },
  );
  const averageSpeed =
    totals.movingTimeSeconds > 0
      ? totals.distanceMeters / totals.movingTimeSeconds
      : null;
  const averageHeartRate =
    totals.heartRateCount > 0
      ? totals.heartRateTotal / totals.heartRateCount
      : null;

  return (
    <div className="md:hidden">
      <table className="w-full table-fixed text-sm">
        <thead className="text-muted-foreground">
          <tr>
            <th className="w-10 py-2 text-left font-display text-[10px] uppercase tracking-wider">
              Lap
            </th>
            <th className="py-2 text-right font-display text-[10px] uppercase tracking-wider">
              Distance
            </th>
            <th className="py-2 text-right font-display text-[10px] uppercase tracking-wider">
              Time
            </th>
            <th className="py-2 text-right font-display text-[10px] uppercase tracking-wider">
              Pace
            </th>
            <th className="py-2 text-right font-display text-[10px] uppercase tracking-wider">
              HR
            </th>
          </tr>
        </thead>
        <tbody className="font-display tabular-nums">
          {laps.map((lap) => (
            <tr key={lap.id} className="border-border/40 border-t">
              <td className="py-3 text-muted-foreground">{lap.index + 1}</td>
              <td className="py-3 text-right">
                {formatDistanceValue(lap.distanceMeters)}
              </td>
              <td className="py-3 text-right">
                {formatDurationClock(lap.movingTimeSeconds)}
              </td>
              <td className="py-3 text-right">
                {formatPaceFromSpeed(lap.averageSpeedMetersPerSecond)}
              </td>
              <td className="py-3 text-right">
                {formatRoundedValue(lap.averageHeartRateBeatsPerMinute)}
              </td>
            </tr>
          ))}
          <tr className="border-border/40 border-t font-semibold">
            <td className="py-3 text-foreground">Total</td>
            <td className="py-3 text-right">
              {formatDistanceValue(totals.distanceMeters)}
            </td>
            <td className="py-3 text-right">
              {formatDurationClock(totals.movingTimeSeconds)}
            </td>
            <td className="py-3 text-right">
              {formatPaceFromSpeed(averageSpeed)}
            </td>
            <td className="py-3 text-right">
              {formatRoundedValue(averageHeartRate)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function formatDistanceValue(value: number | null) {
  return value === null ? "--" : (value / 1000).toFixed(1);
}

function formatSpeedValue(value: number | null) {
  return value === null ? "--" : (value * 3.6).toFixed(1);
}

function formatRoundedValue(value: number | null) {
  return value ? Math.round(value).toString() : "--";
}

function formatStrideLength(value: number | null) {
  return value ? value.toFixed(2) : "--";
}

export { ActivityLapsCard };
