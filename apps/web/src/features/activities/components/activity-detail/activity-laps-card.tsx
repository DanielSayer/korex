import type { ActivityLapSummary } from "@korex/api/modules/activities/activities.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@korex/ui/components/card";
import { RouteIcon } from "lucide-react";
import {
  formatBpm,
  formatDistance,
  formatDurationClock,
  formatMeters,
  formatSpeed,
} from "@/utils/formatters";

type ActivityLapsCardProps = {
  laps: ActivityLapSummary[];
};

function ActivityLapsCard({ laps }: ActivityLapsCardProps) {
  if (laps.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RouteIcon className="size-5" />
          Laps
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-160 text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-2 text-left font-medium">Lap</th>
              <th className="py-2 text-right font-medium">Distance</th>
              <th className="py-2 text-right font-medium">Time</th>
              <th className="py-2 text-right font-medium">Speed</th>
              <th className="py-2 text-right font-medium">Avg HR</th>
              <th className="py-2 text-right font-medium">Elevation</th>
            </tr>
          </thead>
          <tbody>
            {laps.map((lap) => (
              <tr key={lap.id} className="border-b last:border-0">
                <td className="py-2 font-medium">{lap.index}</td>
                <td className="py-2 text-right">
                  {formatDistance(lap.distanceMeters)}
                </td>
                <td className="py-2 text-right">
                  {formatDurationClock(
                    lap.movingTimeSeconds ?? lap.elapsedTimeSeconds,
                  )}
                </td>
                <td className="py-2 text-right">
                  {formatSpeed(lap.averageSpeedMetersPerSecond)}
                </td>
                <td className="py-2 text-right">
                  {formatBpm(lap.averageHeartRateBeatsPerMinute)}
                </td>
                <td className="py-2 text-right">
                  {formatMeters(lap.totalElevationGainMeters)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export { ActivityLapsCard };
