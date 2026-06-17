import { Button } from "@korex/ui/components/button";
import { Card, CardContent } from "@korex/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { QueryRenderer } from "@/components/query-renderer";
import { useIsMobileViewport } from "@/components/responsive";
import { orpc } from "@/utils/orpc";
import { ActivityDetailSkeleton } from "./activity-detail/activity-detail-skeleton";
import { ActivityDetailDesktop } from "./activity-detail-desktop";
import { ActivityDetailMobile } from "./activity-detail-mobile";

type ActivityDetailPageProps = {
  activityId: string;
};

function ActivityDetailPage({ activityId }: ActivityDetailPageProps) {
  const isMobileViewport = useIsMobileViewport();
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
          isMobileViewport ? (
            <ActivityDetailMobile activityId={activityId} summary={summary} />
          ) : (
            <ActivityDetailDesktop activityId={activityId} summary={summary} />
          )
        ) : (
          <ActivityDetailMessage message="This activity could not be found." />
        )
      }
    </QueryRenderer>
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
