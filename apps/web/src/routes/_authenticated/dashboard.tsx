import { createFileRoute } from "@tanstack/react-router";
import { LastFiveRunsSection } from "@/features/dashboard/components/last-five-runs-section";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Here's how your recent training is looking.
        </p>
      </div>
      <LastFiveRunsSection />
    </div>
  );
}
