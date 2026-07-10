import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { SectionLabel } from "@/components/brand";
import { formatDurationClock } from "@/utils/formatters";

type HeartRateZonesCardProps = {
  desktop?: boolean;
  summary: ActivityDetailSummary;
};

function HeartRateZonesCard({
  desktop = false,
  summary,
}: HeartRateZonesCardProps) {
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

      <div
        className={
          desktop
            ? "grid gap-x-10 gap-y-5 lg:grid-cols-2"
            : "flex flex-col gap-3"
        }
      >
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
              <div
                className={
                  desktop
                    ? "h-px bg-border/60"
                    : "h-2 overflow-hidden rounded-full bg-muted"
                }
              >
                <div
                  className={
                    desktop ? "h-1 -translate-y-1/2" : "h-full rounded-full"
                  }
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
    "color-mix(in oklch, var(--chart-1) 65%, var(--foreground))",
    "color-mix(in oklch, var(--chart-2) 65%, var(--foreground))",
    "color-mix(in oklch, var(--chart-3) 65%, var(--foreground))",
    "color-mix(in oklch, var(--chart-4) 65%, var(--foreground))",
    "color-mix(in oklch, var(--chart-5) 65%, var(--foreground))",
  ];

  return (
    zoneColors[(position - 1) % zoneColors.length] ??
    "color-mix(in oklch, var(--chart-1) 65%, var(--foreground))"
  );
}

export { HeartRateZonesCard };
