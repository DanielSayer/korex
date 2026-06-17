import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { Separator } from "@korex/ui/components/separator";
import {
  formatDistanceValue,
  formatDurationClock,
  formatPaceFromSpeed,
} from "@/utils/formatters";
import { MetricValue } from "./metric-value";
import { StatGroup } from "./stat-group";

type ActivityStatsProps = {
  summary: ActivityDetailSummary;
};

function ActivityStats({ summary }: ActivityStatsProps) {
  const { activity } = summary;
  const durationSeconds =
    activity.movingTimeSeconds ?? activity.elapsedTimeSeconds;

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <p className="mb-1 font-medium text-muted-foreground text-xs uppercase">
          Distance
        </p>
        <MetricValue
          unit="km"
          value={formatDistanceValue(activity.distanceMeters)}
          valueClassName="font-black text-5xl leading-none md:text-6xl"
        />
      </div>

      <Separator />

      <StatGroup
        items={[
          {
            label: "Time",
            value: formatDurationClock(durationSeconds),
          },
          {
            label: "Avg Pace",
            unit: "/km",
            value: formatPaceFromSpeed(activity.averageSpeedMetersPerSecond),
          },
          {
            label: "Avg HR",
            unit: "bpm",
            value: formatBpmValue(activity.averageHeartRateBeatsPerMinute),
          },
        ]}
      />

      <Separator />

      <StatGroup
        items={[
          {
            label: "Elevation",
            unit: "m",
            value: formatRoundedValue(activity.totalElevationGainMeters),
          },
          {
            label: "Cadence",
            unit: "spm",
            value: activity.averageCadenceStepsPerMinute
              ? Math.round(activity.averageCadenceStepsPerMinute).toString()
              : "--",
          },
          {
            label: "Calories",
            unit: "kcal",
            value: activity.energyKilocalories
              ? Math.round(activity.energyKilocalories).toString()
              : "--",
          },
        ]}
      />
    </div>
  );
}

function formatBpmValue(value: number | null) {
  return value ? Math.round(value).toString() : "--";
}

function formatRoundedValue(value: number | null) {
  return value ? Math.round(value).toString() : "--";
}

export { ActivityStats };
