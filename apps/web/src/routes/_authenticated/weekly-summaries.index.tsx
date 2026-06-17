import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeftIcon } from "lucide-react";
import { PageHeader, PageLayout } from "@/components/page-layout";
import { WeeklyTrainingSummariesSection } from "@/features/weekly-training-summaries/components/weekly-training-summaries-section";

export const Route = createFileRoute("/_authenticated/weekly-summaries/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout className="gap-4 p-3 md:gap-6 md:p-0">
      <Link
        className="inline-flex w-fit items-center gap-1 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground md:hidden"
        to="/more"
      >
        <ChevronLeftIcon className="size-4" />
        More
      </Link>
      <PageHeader
        className="border-border/70 border-b pb-4 md:border-b-0 md:pb-0"
        description="Replay your completed training weeks."
        title="Weekly Summaries"
      />
      <WeeklyTrainingSummariesSection />
    </PageLayout>
  );
}
