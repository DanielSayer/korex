import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeftIcon } from "lucide-react";
import { RouteAccent } from "@/components/brand";
import { PageHeader, PageLayout } from "@/components/page-layout";
import { WeeklyTrainingSummariesSection } from "@/features/weekly-training-summaries/components/weekly-training-summaries-section";

export const Route = createFileRoute("/_authenticated/weekly-summaries/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout className="gap-6 p-4 md:gap-6 md:p-0">
      <Link
        className="inline-flex w-fit items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground md:hidden"
        to="/more"
      >
        <ChevronLeftIcon className="size-4" />
        More
      </Link>
      <header className="md:hidden">
        <h1 className="font-display text-3xl lowercase leading-none tracking-tight">
          Weekly summaries
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Replay your completed training weeks.
        </p>
        <RouteAccent className="mt-3 h-3 w-16 text-primary" />
      </header>
      <PageHeader
        className="hidden border-border/70 border-b pb-4 md:flex md:border-b-0 md:pb-0"
        description="Replay your completed training weeks."
        eyebrow="Weekly summaries"
        title="Week replay"
      />
      <WeeklyTrainingSummariesSection />
    </PageLayout>
  );
}
