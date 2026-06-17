import { createFileRoute } from "@tanstack/react-router";
import { TrainingGoalsPage } from "@/features/training-goals/components/training-goals-page";

export const Route = createFileRoute("/_authenticated/goals")({
  component: RouteComponent,
});

function RouteComponent() {
  return <TrainingGoalsPage />;
}
