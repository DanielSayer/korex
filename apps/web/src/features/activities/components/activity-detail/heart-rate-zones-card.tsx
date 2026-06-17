import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { HeartPulseIcon } from "lucide-react";
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
    <section className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 font-bold text-2xl md:text-3xl">
          <HeartPulseIcon className="size-5 md:size-6" />
          Heart Rate Zones
        </h2>
      </div>

      <div className="space-y-3 border-y py-4">
        {summary.heartRateZoneSnapshots.map((zone) => {
          const zoneTime =
            summary.heartRateZoneTimes.find(
              (item) => item.position === zone.position,
            )?.timeSeconds ?? 0;
          const percentage =
            totalSeconds > 0 ? (zoneTime / totalSeconds) * 100 : 0;
          const color = getZoneColor(zone.position);

          return (
            <div key={zone.position} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">
                  {zone.name} ({formatZoneRange(zone)})
                </span>
                <span className="text-muted-foreground">
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
