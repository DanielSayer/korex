import { useQuery } from "@tanstack/react-query";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";
import { WeeklyDistanceSkeleton } from "./weekly-distance-skeleton";
import { WeeklyDistanceWidget } from "./weekly-distance-widget";

function WeeklyDistanceSection() {
  const weeklyDistance = useQuery(
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
      query={weeklyDistance}
    >
      {(data) => <WeeklyDistanceWidget weeklyDistance={data} />}
    </QueryRenderer>
  );
}

export { WeeklyDistanceSection };
