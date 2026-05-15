import { useQuery } from "@tanstack/react-query";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";
import { WeeklyTrainingSummaryList } from "./weekly-training-summary-list";
import { WeeklyTrainingSummaryListSkeleton } from "./weekly-training-summary-list-skeleton";

function WeeklyTrainingSummariesSection() {
  const summariesQuery = useQuery(
    orpc.activities.weeklyTrainingSummaries.queryOptions(),
  );

  return (
    <QueryRenderer
      error={
        <ErrorMessage
          message="Could not load weekly summaries."
          variant="banner"
        />
      }
      loading={<WeeklyTrainingSummaryListSkeleton />}
      query={summariesQuery}
    >
      {(summaries) => <WeeklyTrainingSummaryList summaries={summaries} />}
    </QueryRenderer>
  );
}

export { WeeklyTrainingSummariesSection };
