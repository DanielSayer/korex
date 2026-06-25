import { RouteAccent } from "@/components/brand";
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
        description="Set the next mark. Track live progress."
        eyebrow="Goals"
        title="Targets"
      />
      <TrainingGoalsSection />
    </PageLayout>
  );
}

function TrainingGoalsMobile() {
  return (
    <PageLayout className="gap-6 p-4">
      <header className="min-w-0">
        <p className="font-display text-[11px] text-primary uppercase tracking-[0.18em]">
          Goals
        </p>
        <h1 className="mt-1 font-display text-3xl lowercase leading-none tracking-tight">
          Targets
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Track progress and manage recurring running goals.
        </p>
        <RouteAccent className="mt-3 h-3 w-16 text-primary" />
      </header>
      <TrainingGoalsSection density="mobile" />
    </PageLayout>
  );
}

export { TrainingGoalsPage };
