import { useQuery } from "@tanstack/react-query";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";
import { LastFiveRuns } from "./last-five-runs";
import { LastFiveRunsSkeleton } from "./last-five-runs-skeleton";

function LastFiveRunsSection() {
  const recentActivities = useQuery(orpc.activities.recent.queryOptions());

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg">Last 5 Runs</h2>
        </div>
      </div>
      <QueryRenderer
        error={
          <ErrorMessage
            message="Could not load recent runs."
            variant="banner"
          />
        }
        loading={<LastFiveRunsSkeleton />}
        query={recentActivities}
      >
        {(runs) => <LastFiveRuns runs={runs} />}
      </QueryRenderer>
    </section>
  );
}

export { LastFiveRunsSection };
