import { createFileRoute } from "@tanstack/react-router";
import { WeeklyTrainingSummariesSection } from "@/features/weekly-training-summaries/components/weekly-training-summaries-section";

export const Route = createFileRoute("/_authenticated/weekly-summaries")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">
          Weekly Summaries
        </h1>
        <p className="text-muted-foreground text-sm">
          Replay your completed training weeks.
        </p>
      </div>
      <WeeklyTrainingSummariesSection />
    </div>
  );
}
