import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { SectionLabel } from "@/components/brand";
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
    <div className="space-y-10">
      <ActivityDetailHeader activity={summary.activity} />

      <section className="grid border-border/50 border-y lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.7fr)]">
        <div className="py-8 lg:border-border/50 lg:border-r lg:pr-8">
          <ActivityStats summary={summary} />
        </div>
        <div className="border-border/50 border-t py-8 lg:border-t-0 lg:pl-8">
          <SectionLabel>Activity map</SectionLabel>
          <div className="mt-4 h-[30rem]">
            <ActivityRouteMap desktop map={summary.map} />
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-border/50 border-b pb-10 lg:grid-cols-2 lg:divide-x lg:divide-border/50">
        <div>
          <BestEffortsCard efforts={summary.bestEfforts} />
        </div>
        <div className="lg:pl-8">
          <ActivityEquipmentCard activityId={activityId} summary={summary} />
        </div>
      </section>

      <ActivityLapsCard laps={summary.laps} />
      <section className="border-border/50 border-y py-8">
        <TrainingNotesSection
          activityId={summary.activity.id}
          type="activity"
        />
      </section>
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
