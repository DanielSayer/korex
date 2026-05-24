import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@korex/ui/components/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulseIcon className="size-5" />
          Heart Rate Zones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {summary.heartRateZoneSnapshots.map((zone) => {
          const zoneTime =
            summary.heartRateZoneTimes.find(
              (item) => item.position === zone.position,
            )?.timeSeconds ?? 0;
          const percentage =
            totalSeconds > 0 ? (zoneTime / totalSeconds) * 100 : 0;

          return (
            <div key={zone.position} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{zone.name}</span>
                <span className="text-muted-foreground">
                  {formatDurationClock(zoneTime)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export { HeartRateZonesCard };
