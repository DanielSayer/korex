import { Button } from "@korex/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeftIcon } from "lucide-react";
import { z } from "zod";
import { PageHeader, PageLayout } from "@/components/page-layout";
import { useIsMobileViewport } from "@/components/responsive";
import { RouteHeatmapMap } from "@/features/route-heatmap/components/route-heatmap-map";
import type { RouteHeatmapDisplayMode } from "@/features/route-heatmap/types";
import { cn } from "@/lib/utils";

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
  const isMobileViewport = useIsMobileViewport();
  const handleDisplayModeChange = (mode: RouteHeatmapDisplayMode) =>
    navigate({
      search: { mode: mode === "density" ? undefined : mode },
    });

  return isMobileViewport ? (
    <HeatmapMobile
      displayMode={displayMode}
      onDisplayModeChange={handleDisplayModeChange}
    />
  ) : (
    <HeatmapDesktop
      displayMode={displayMode}
      onDisplayModeChange={handleDisplayModeChange}
    />
  );
}

function HeatmapDesktop({
  displayMode,
  onDisplayModeChange,
}: {
  displayMode: RouteHeatmapDisplayMode;
  onDisplayModeChange: (displayMode: RouteHeatmapDisplayMode) => void;
}) {
  return (
    <PageLayout>
      <PageHeader
        title="Heatmap"
        description={getHeatmapDescription(displayMode)}
        actions={
          <RouteHeatmapDisplayModeControl
            displayMode={displayMode}
            onDisplayModeChange={onDisplayModeChange}
          />
        }
      />
      <RouteHeatmapMap displayMode={displayMode} />
    </PageLayout>
  );
}

function HeatmapMobile({
  displayMode,
  onDisplayModeChange,
}: {
  displayMode: RouteHeatmapDisplayMode;
  onDisplayModeChange: (displayMode: RouteHeatmapDisplayMode) => void;
}) {
  return (
    <div className="grid min-h-full grid-rows-[auto_minmax(0,1fr)]">
      <header className="grid gap-3 border-border/70 border-b p-3">
        <Link
          className="inline-flex w-fit items-center gap-1 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
          to="/more"
        >
          <ChevronLeftIcon className="size-4" />
          More
        </Link>
        <div className="min-w-0">
          <p className="font-semibold text-primary text-xs uppercase">
            Heatmap
          </p>
          <h1 className="mt-1 font-semibold text-2xl tracking-tight">
            Activity Route Heatmap
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {getHeatmapDescription(displayMode)}
          </p>
        </div>
        <RouteHeatmapDisplayModeControl
          className="w-full"
          displayMode={displayMode}
          onDisplayModeChange={onDisplayModeChange}
        />
      </header>
      <RouteHeatmapMap
        className="h-[calc(100svh-15.5rem-env(safe-area-inset-bottom))] min-h-96"
        displayMode={displayMode}
      />
    </div>
  );
}

function RouteHeatmapDisplayModeControl({
  className,
  displayMode,
  onDisplayModeChange,
}: {
  className?: string;
  displayMode: RouteHeatmapDisplayMode;
  onDisplayModeChange: (displayMode: RouteHeatmapDisplayMode) => void;
}) {
  return (
    <div
      className={cn(
        "inline-grid h-9 grid-cols-2 rounded-md border bg-muted/30 p-0.5",
        className,
      )}
    >
      {(["density", "visited"] as const).map((mode) => (
        <Button
          className="h-7 min-w-0"
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

function getHeatmapDescription(displayMode: RouteHeatmapDisplayMode) {
  return displayMode === "density"
    ? "Run frequency across your saved routes."
    : "Roads you have visited across your saved routes.";
}
