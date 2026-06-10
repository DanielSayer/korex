import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageLayout } from "@/components/page-layout";
import { TrainingGoalsSection } from "@/features/training-goals/components/training-goals-section";

export const Route = createFileRoute("/_authenticated/goals")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout>
      <PageHeader
        description="Manage recurring running goals and track live progress."
        title="Goals"
      />
      <TrainingGoalsSection />
    </PageLayout>
  );
}
