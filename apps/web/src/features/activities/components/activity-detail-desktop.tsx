import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { Separator } from "@korex/ui/components/separator";
import { QueryRenderer } from "@/components/query-renderer";
import { TrainingNotesSection } from "@/features/training-notes/components/training-notes-section";
import { useActivityStreams } from "../hooks/use-activity-streams";
import { ActivityDetailHeader } from "./activity-detail/activity-detail-header";
import { ActivityEquipmentCard } from "./activity-detail/activity-equipment-card";
import { ActivityLapsCard } from "./activity-detail/activity-laps-card";
import { ActivityRouteMap } from "./activity-detail/activity-route-map";
import { ActivityStats } from "./activity-detail/activity-stats";
import { ActivityStreamCharts } from "./activity-detail/activity-stream-charts";
import { ActivityStreamChartsSkeleton } from "./activity-detail/activity-stream-charts-skeleton";
import { BestEffortsCard } from "./activity-detail/best-efforts-card";
import { HeartRateZonesCard } from "./activity-detail/heart-rate-zones-card";

type ActivityDetailDesktopProps = {
  activityId: string;
  summary: ActivityDetailSummary;
};

function ActivityDetailDesktop({
  activityId,
  summary,
}: ActivityDetailDesktopProps) {
  const streamsQuery = useActivityStreams(summary.activity.id);

  return (
    <div className="space-y-6">
      <ActivityDetailHeader activity={summary.activity} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="min-h-96 lg:col-span-2">
          <ActivityRouteMap map={summary.map} />
        </div>
        <div className="flex flex-col justify-between rounded-xl border bg-card p-6">
          <ActivityStats summary={summary} />
          <Separator className="my-6" />
          <BestEffortsCard efforts={summary.bestEfforts} />
          <Separator className="my-6" />
          <ActivityEquipmentCard activityId={activityId} summary={summary} />
        </div>
      </div>

      <ActivityLapsCard laps={summary.laps} />
      <TrainingNotesSection activityId={summary.activity.id} type="activity" />
      <HeartRateZonesCard summary={summary} />
      <QueryRenderer
        error={null}
        loading={<ActivityStreamChartsSkeleton />}
        query={streamsQuery}
      >
        {(streams) =>
          streams ? (
            <ActivityStreamCharts streams={streams} summary={summary} />
          ) : null
        }
      </QueryRenderer>
    </div>
  );
}

export { ActivityDetailDesktop };
