import { useQuery } from "@tanstack/react-query";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { TrainingNotesSection } from "@/features/training-notes/components/training-notes-section";
import { orpc } from "@/utils/orpc";
import { WeeklyTrainingSummaryList } from "./weekly-training-summary-list";
import { WeeklyTrainingSummaryListSkeleton } from "./weekly-training-summary-list-skeleton";

function WeeklyTrainingSummariesSection() {
  const summariesQuery = useQuery(
    orpc.activities.weeklyTrainingSummaries.queryOptions(),
  );
  const currentWeekStartAt = getTrainingWeekStartAt(new Date());

  return (
    <div className="space-y-6">
      <TrainingNotesSection
        title="Current Week Notes"
        type="trainingWeek"
        weekStartAt={currentWeekStartAt}
      />
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
    </div>
  );
}

const brisbaneUtcOffsetHours = 10;
const millisecondsPerHour = 60 * 60 * 1000;

function getTrainingWeekStartAt(date: Date) {
  const brisbaneTime = new Date(
    date.getTime() + brisbaneUtcOffsetHours * millisecondsPerHour,
  );
  const day = brisbaneTime.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  brisbaneTime.setUTCHours(0, 0, 0, 0);
  brisbaneTime.setUTCDate(brisbaneTime.getUTCDate() - daysSinceMonday);

  return new Date(
    brisbaneTime.getTime() - brisbaneUtcOffsetHours * millisecondsPerHour,
  );
}

export { WeeklyTrainingSummariesSection };
