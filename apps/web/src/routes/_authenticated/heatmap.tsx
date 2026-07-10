import { Button } from "@korex/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeftIcon } from "lucide-react";
import { z } from "zod";
import { RouteAccent } from "@/components/brand";
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
        description={getHeatmapDescription(displayMode)}
        eyebrow="Heatmap"
        title="Route heatmap"
        actions={
          <RouteHeatmapDisplayModeControl
            displayMode={displayMode}
            onDisplayModeChange={onDisplayModeChange}
          />
        }
      />
      <RouteHeatmapMap displayMode={displayMode} journal />
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
      <header className="grid gap-3 border-border/40 border-b p-4">
        <Link
          className="inline-flex w-fit items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
          to="/more"
        >
          <ChevronLeftIcon className="size-4" />
          More
        </Link>
        <div className="min-w-0">
          <p className="font-display text-[11px] text-primary uppercase tracking-[0.18em]">
            Heatmap
          </p>
          <h1 className="mt-1 font-display text-3xl lowercase leading-none tracking-tight">
            Route heatmap
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {getHeatmapDescription(displayMode)}
          </p>
          <RouteAccent className="mt-3 h-3 w-16 text-primary" />
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
        "inline-grid h-9 grid-cols-2 rounded-md border border-border/50 bg-background p-0.5 shadow-xs",
        className,
      )}
    >
      {(["density", "visited"] as const).map((mode) => (
        <Button
          aria-pressed={displayMode === mode}
          className="h-7 min-w-0"
          key={mode}
          onClick={() => onDisplayModeChange(mode)}
          size="sm"
          type="button"
          variant={displayMode === mode ? "default" : "ghost"}
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
