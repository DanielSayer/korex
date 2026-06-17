import { createFileRoute } from "@tanstack/react-router";
import { ErrorMessage } from "@/components/error-message";
import { WeeklyTrainingSummaryDetailPage } from "@/features/weekly-training-summaries/components/weekly-training-summary-detail-page";

export const Route = createFileRoute(
  "/_authenticated/weekly-summaries/$weekStartAt",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { weekStartAt } = Route.useParams();
  const parsedWeekStartAt = parseTrainingWeekParam(weekStartAt);

  if (!parsedWeekStartAt) {
    return (
      <div className="p-3 md:p-0">
        <ErrorMessage
          message="This Weekly Training Summary link is not valid."
          variant="banner"
        />
      </div>
    );
  }

  return <WeeklyTrainingSummaryDetailPage weekStartAt={parsedWeekStartAt} />;
}

function parseTrainingWeekParam(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00+10:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}
