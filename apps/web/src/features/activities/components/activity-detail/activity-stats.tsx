import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { SectionLabel } from "@/components/brand";
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
    <div>
      <SectionLabel>Activity summary</SectionLabel>
      <div>
        <p className="mt-5 font-display text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
          Distance
        </p>
        <MetricValue
          unit="km"
          value={formatDistanceValue(activity.distanceMeters)}
          valueClassName="font-display text-7xl tabular-nums leading-[0.85] tracking-tight"
        />
      </div>

      <div className="mt-8 space-y-5 border-border/50 border-t pt-6">
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
