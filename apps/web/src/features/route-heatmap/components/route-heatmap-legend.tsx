import type { RouteHeatmapDisplayMode } from "../types";
import { getRouteHeatmapRampCss } from "../utils/route-heatmap-style";

function RouteHeatmapLegend({
  displayMode,
}: {
  displayMode: RouteHeatmapDisplayMode;
}) {
  if (displayMode === "visited") {
    return (
      <div className="absolute inset-x-0 bottom-0 z-1000 border-border/70 border-t bg-background/95 px-3 py-2 text-xs backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-sm border border-white/10"
            style={{ background: "rgb(255, 248, 232)" }}
          />
          <span className="font-medium text-foreground">Visited roads</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-1000 border-border/70 border-t bg-background/95 px-3 py-2 text-xs backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-medium text-foreground">Route density</span>
      </div>
      <div
        className="h-2.5 rounded-sm border border-white/10"
        style={{
          background: `linear-gradient(to right, ${getRouteHeatmapRampCss()})`,
        }}
      />
      <div className="mt-1.5 flex justify-between text-muted-foreground">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

export { RouteHeatmapLegend };
