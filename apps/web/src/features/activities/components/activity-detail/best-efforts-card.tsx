import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@korex/ui/components/card";
import { TrophyIcon } from "lucide-react";
import { formatDurationClock } from "@/utils/formatters";

type BestEffortsCardProps = {
  efforts: ActivityDetailSummary["bestEfforts"];
};

function BestEffortsCard({ efforts }: BestEffortsCardProps) {
  if (efforts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrophyIcon className="size-5" />
          Best Efforts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {efforts.map((effort) => (
          <div
            key={effort.standardDistanceCode}
            className="flex items-center justify-between gap-3 rounded-md border p-3"
          >
            <span className="font-medium">
              {formatBestEffortDistance(effort.standardDistanceCode)}
            </span>
            <span className="text-muted-foreground text-sm">
              {formatDurationClock(effort.durationSeconds)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatBestEffortDistance(value: string) {
  return value
    .replace("half_marathon", "Half marathon")
    .replace("marathon", "Marathon")
    .replace("mi", " mi")
    .toUpperCase();
}

export { BestEffortsCard };
