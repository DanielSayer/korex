import type { ActivityLapSummary } from "@korex/api/modules/activities/activities.types";
import { RouteIcon } from "lucide-react";
import { formatDurationClock } from "@/utils/formatters";
import { MetricValue } from "./metric-value";

type ActivityLapsCardProps = {
  laps: ActivityLapSummary[];
};

function ActivityLapsCard({ laps }: ActivityLapsCardProps) {
  if (laps.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 font-bold text-3xl">
          <RouteIcon className="size-6" />
          Laps
        </h2>
        <p className="text-muted-foreground text-sm">
          Detailed lap data for your activity.
        </p>
      </div>

      <div className="overflow-x-auto border-y">
        <table className="w-full min-w-280 text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Lap</th>
              <th className="px-3 py-2 text-right font-medium">Distance</th>
              <th className="px-3 py-2 text-right font-medium">Moving</th>
              <th className="px-3 py-2 text-right font-medium">Elapsed</th>
              <th className="px-3 py-2 text-right font-medium">Start</th>
              <th className="px-3 py-2 text-right font-medium">End</th>
              <th className="px-3 py-2 text-right font-medium">Avg Speed</th>
              <th className="px-3 py-2 text-right font-medium">Max Speed</th>
              <th className="px-3 py-2 text-right font-medium">Avg HR</th>
              <th className="px-3 py-2 text-right font-medium">Max HR</th>
              <th className="px-3 py-2 text-right font-medium">Cadence</th>
              <th className="px-3 py-2 text-right font-medium">Stride</th>
              <th className="px-3 py-2 text-right font-medium">Elevation</th>
            </tr>
          </thead>
          <tbody>
            {laps.map((lap) => (
              <tr key={lap.id} className="border-b last:border-0">
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
