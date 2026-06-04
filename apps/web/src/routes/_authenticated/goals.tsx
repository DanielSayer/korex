import { createFileRoute } from "@tanstack/react-router";
import { TrainingGoalsSection } from "@/features/training-goals/components/training-goals-section";

export const Route = createFileRoute("/_authenticated/goals")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Goals</h1>
        <p className="text-muted-foreground text-sm">
          Manage recurring running goals and track live progress.
        </p>
      </div>
      <TrainingGoalsSection />
    </div>
  );
}
