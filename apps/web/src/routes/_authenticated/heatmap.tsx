import { Button } from "@korex/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { RouteHeatmapMap } from "@/features/route-heatmap/components/route-heatmap-map";
import type { RouteHeatmapDisplayMode } from "@/features/route-heatmap/types";

export const Route = createFileRoute("/_authenticated/heatmap")({
  validateSearch: z.object({
    mode: z.enum(["density", "visited"]).optional().catch(undefined),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const displayMode = search.mode ?? "density";

  return (
    <div className="flex min-h-[calc(100svh-8.5rem)] flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Heatmap</h1>
          <p className="text-muted-foreground text-sm">
            {displayMode === "density"
              ? "Run frequency across your saved routes."
              : "Roads you have visited across your saved routes."}
          </p>
        </div>
        <RouteHeatmapDisplayModeControl
          displayMode={displayMode}
          onDisplayModeChange={(mode) =>
            navigate({
              search: { mode: mode === "density" ? undefined : mode },
            })
          }
        />
      </div>
      <RouteHeatmapMap displayMode={displayMode} />
    </div>
  );
}

function RouteHeatmapDisplayModeControl({
  displayMode,
  onDisplayModeChange,
}: {
  displayMode: RouteHeatmapDisplayMode;
  onDisplayModeChange: (displayMode: RouteHeatmapDisplayMode) => void;
}) {
  return (
    <div className="inline-grid h-9 grid-cols-2 rounded-md border bg-muted/30 p-0.5">
      {(["density", "visited"] as const).map((mode) => (
        <Button
          className="h-7 min-w-20"
          key={mode}
          onClick={() => onDisplayModeChange(mode)}
          size="sm"
          type="button"
          variant={displayMode === mode ? "secondary" : "ghost"}
        >
          {mode === "density" ? "Density" : "Visited"}
        </Button>
      ))}
    </div>
  );
}
