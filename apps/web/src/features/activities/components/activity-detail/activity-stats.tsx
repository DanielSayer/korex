import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@korex/ui/components/card";
import { Separator } from "@korex/ui/components/separator";
import {
  ClockIcon,
  FlameIcon,
  FootprintsIcon,
  GaugeIcon,
  HeartPulseIcon,
  MountainIcon,
} from "lucide-react";
import {
  formatBpm,
  formatDistanceValue,
  formatDurationClock,
  formatMeters,
  formatSpeed,
} from "@/utils/formatters";
import { MetricGrid } from "./metric-grid";

type ActivityStatsProps = {
  summary: ActivityDetailSummary;
};

function ActivityStats({ summary }: ActivityStatsProps) {
  const { activity } = summary;
  const durationSeconds =
    activity.movingTimeSeconds ?? activity.elapsedTimeSeconds;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="font-medium text-muted-foreground text-xs uppercase">
            Distance
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-bold text-5xl">
              {formatDistanceValue(activity.distanceMeters)}
            </span>
            <span className="text-muted-foreground">km</span>
          </div>
        </div>
        <Separator />
        <MetricGrid
          metrics={[
            {
              icon: ClockIcon,
              label: "Time",
              value: formatDurationClock(durationSeconds),
            },
            {
              icon: GaugeIcon,
              label: "Avg Speed",
              value: formatSpeed(activity.averageSpeedMetersPerSecond),
            },
            {
              icon: HeartPulseIcon,
              label: "Avg HR",
              value: formatBpm(activity.averageHeartRateBeatsPerMinute),
            },
            {
              icon: MountainIcon,
              label: "Elevation",
              value: formatMeters(activity.totalElevationGainMeters),
            },
            {
              icon: FootprintsIcon,
              label: "Cadence",
              value: activity.averageCadenceStepsPerMinute
                ? `${Math.round(activity.averageCadenceStepsPerMinute)} spm`
                : "--",
            },
            {
              icon: FlameIcon,
              label: "Calories",
              value: activity.energyKilocalories
                ? `${Math.round(activity.energyKilocalories)} kcal`
                : "--",
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

export { ActivityStats };
