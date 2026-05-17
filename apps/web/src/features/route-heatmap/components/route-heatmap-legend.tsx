import { getRouteHeatmapRampCss } from "../utils/route-heatmap-style";

function RouteHeatmapLegend() {
  return (
    <div className="absolute right-3 bottom-3 z-1000 w-56 rounded-md border bg-background/90 p-3 text-xs shadow-sm backdrop-blur-sm">
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
