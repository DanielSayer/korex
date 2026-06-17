import { PageHeader, PageLayout } from "@/components/page-layout";
import { useIsMobileViewport } from "@/components/responsive";
import { TrainingGoalsSection } from "./training-goals-section";

function TrainingGoalsPage() {
  const isMobileViewport = useIsMobileViewport();

  return isMobileViewport ? <TrainingGoalsMobile /> : <TrainingGoalsDesktop />;
}

function TrainingGoalsDesktop() {
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

function TrainingGoalsMobile() {
  return (
    <PageLayout className="gap-4 p-3">
      <header className="min-w-0">
        <p className="font-semibold text-primary text-xs uppercase">Goals</p>
        <h1 className="mt-1 font-semibold text-2xl tracking-tight">
          Training targets
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Track current progress and manage recurring running goals.
        </p>
      </header>
      <TrainingGoalsSection density="mobile" />
    </PageLayout>
  );
}

export { TrainingGoalsPage };
