import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageLayout } from "@/components/page-layout";
import { WeeklyTrainingSummariesSection } from "@/features/weekly-training-summaries/components/weekly-training-summaries-section";

export const Route = createFileRoute("/_authenticated/weekly-summaries")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout>
      <PageHeader
        description="Replay your completed training weeks."
        title="Weekly Summaries"
      />
      <WeeklyTrainingSummariesSection />
    </PageLayout>
  );
}
