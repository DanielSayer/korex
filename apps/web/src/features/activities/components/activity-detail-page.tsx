import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { Card, CardContent } from "@korex/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";
import { ActivityDetailHeader } from "./activity-detail/activity-detail-header";
import { ActivityDetailSkeleton } from "./activity-detail/activity-detail-skeleton";
import { ActivityLapsCard } from "./activity-detail/activity-laps-card";
import { ActivityRouteMap } from "./activity-detail/activity-route-map";
import { ActivityStats } from "./activity-detail/activity-stats";
import { BestEffortsCard } from "./activity-detail/best-efforts-card";
import { HeartRateZonesCard } from "./activity-detail/heart-rate-zones-card";

type ActivityDetailPageProps = {
  activityId: string;
};

function ActivityDetailPage({ activityId }: ActivityDetailPageProps) {
  const activityQuery = useQuery(
    orpc.activities.summary.queryOptions({ input: { activityId } }),
  );

  return (
    <QueryRenderer
      error={(error) => (
        <ActivityDetailMessage
          message={`Failed to load activity: ${getErrorMessage(error)}`}
          tone="error"
        />
      )}
      loading={<ActivityDetailSkeleton />}
      query={activityQuery}
    >
      {(summary) =>
        summary ? (
          <ActivityDetailView summary={summary} />
        ) : (
          <ActivityDetailMessage message="This activity could not be found." />
        )
      }
    </QueryRenderer>
  );
}

function ActivityDetailView({ summary }: { summary: ActivityDetailSummary }) {
  return (
    <div className="space-y-6">
      <ActivityDetailHeader activity={summary.activity} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <div className="space-y-6">
          <ActivityRouteMap map={summary.map} />
          <ActivityLapsCard laps={summary.laps} />
        </div>
        <div className="space-y-6">
          <ActivityStats summary={summary} />
          <BestEffortsCard efforts={summary.bestEfforts} />
          <HeartRateZonesCard summary={summary} />
        </div>
      </div>
    </div>
  );
}

function ActivityDetailMessage({
  message,
  tone = "muted",
}: {
  message: string;
  tone?: "error" | "muted";
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <p
          className={
            tone === "error"
              ? "text-destructive text-sm"
              : "text-muted-foreground text-sm"
          }
        >
          {message}
        </p>
        <Button variant="outline" render={<Link to="/dashboard" />}>
          <ArrowLeftIcon className="size-4" />
          Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export { ActivityDetailPage };
