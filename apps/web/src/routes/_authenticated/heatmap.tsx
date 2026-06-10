import { Button } from "@korex/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PageHeader, PageLayout } from "@/components/page-layout";
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
    <PageLayout>
      <PageHeader
        title="Heatmap"
        description={
          displayMode === "density"
            ? "Run frequency across your saved routes."
            : "Roads you have visited across your saved routes."
        }
        actions={
          <RouteHeatmapDisplayModeControl
            displayMode={displayMode}
            onDisplayModeChange={(mode) =>
              navigate({
                search: { mode: mode === "density" ? undefined : mode },
              })
            }
          />
        }
      />
      <RouteHeatmapMap displayMode={displayMode} />
    </PageLayout>
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
