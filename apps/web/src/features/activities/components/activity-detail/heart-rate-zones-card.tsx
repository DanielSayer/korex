import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { SectionLabel } from "@/components/brand";
import { formatDurationClock } from "@/utils/formatters";

type HeartRateZonesCardProps = {
  summary: ActivityDetailSummary;
};

function HeartRateZonesCard({ summary }: HeartRateZonesCardProps) {
  if (
    summary.heartRateZoneSnapshots.length === 0 ||
    summary.heartRateZoneTimes.length === 0
  ) {
    return null;
  }

  const totalSeconds = summary.heartRateZoneTimes.reduce(
    (total, zoneTime) => total + zoneTime.timeSeconds,
    0,
  );

  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>Heart rate zones</SectionLabel>

      <div className="flex flex-col gap-3">
        {summary.heartRateZoneSnapshots.map((zone) => {
          const zoneTime =
            summary.heartRateZoneTimes.find(
              (item) => item.position === zone.position,
            )?.timeSeconds ?? 0;
          const percentage =
            totalSeconds > 0 ? (zoneTime / totalSeconds) * 100 : 0;
          const color = getZoneColor(zone.position);

          return (
            <div key={zone.position} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">
                  {zone.name} ({formatZoneRange(zone)})
                </span>
                <span className="font-display text-muted-foreground tabular-nums">
                  {formatDurationClock(zoneTime)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color, width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatZoneRange({
  maxBpm,
  minBpm,
}: ActivityDetailSummary["heartRateZoneSnapshots"][number]) {
  return maxBpm === null ? `${minBpm}+` : `${minBpm}-${maxBpm}`;
}

function getZoneColor(position: number) {
  const zoneColors = [
    "#7c3aed",
    "#2563eb",
    "#16a34a",
    "#eab308",
    "#f97316",
    "#dc2626",
  ];

  return zoneColors[position - 1] ?? zoneColors.at(-1) ?? "#dc2626";
}

export { HeartRateZonesCard };
