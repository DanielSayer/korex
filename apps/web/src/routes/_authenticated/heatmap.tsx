import { createFileRoute } from "@tanstack/react-router";
import { RouteHeatmapMap } from "@/features/route-heatmap/components/route-heatmap-map";

export const Route = createFileRoute("/_authenticated/heatmap")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex min-h-[calc(100svh-8.5rem)] flex-col gap-4">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Heatmap</h1>
        <p className="text-muted-foreground text-sm">
          Run frequency across your saved routes.
        </p>
      </div>
      <RouteHeatmapMap />
    </div>
  );
}
