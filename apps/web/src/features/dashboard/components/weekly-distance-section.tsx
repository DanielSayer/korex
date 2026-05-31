import type { DashboardWeeklyDistance } from "@korex/api/modules/activities/activities.types";
import { useQuery } from "@tanstack/react-query";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";
import { WeeklyDistanceSkeleton } from "./weekly-distance-skeleton";
import { WeeklyDistanceWidget } from "./weekly-distance-widget";

function WeeklyDistanceSection({
  weeklyDistance,
}: {
  weeklyDistance?: DashboardWeeklyDistance;
}) {
  if (weeklyDistance) {
    return <WeeklyDistanceWidget weeklyDistance={weeklyDistance} />;
  }

  return <WeeklyDistanceQuerySection />;
}

function WeeklyDistanceQuerySection() {
  const weeklyDistanceQuery = useQuery(
    orpc.activities.dashboardWeeklyDistance.queryOptions(),
  );

  return (
    <QueryRenderer
      error={
        <ErrorMessage
          message="Could not load weekly distance."
          variant="banner"
        />
      }
      loading={<WeeklyDistanceSkeleton />}
      query={weeklyDistanceQuery}
    >
      {(data) => <WeeklyDistanceWidget weeklyDistance={data} />}
    </QueryRenderer>
  );
}

export { WeeklyDistanceSection };
