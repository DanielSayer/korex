import { Loader2Icon, LocateFixedIcon } from "lucide-react";
import { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useThemePreset } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { getServerUrl } from "@/utils/server-url";
import {
  routeHeatmapFallbackCenter,
  routeHeatmapInitialLocationZoom,
  routeHeatmapMaxMaterializedZoom,
  routeHeatmapMinMaterializedZoom,
} from "../constants";
import type { RouteHeatmapDisplayMode } from "../types";
import { InitialUserLocationView } from "./initial-user-location-view";
import { RouteHeatmapLegend } from "./route-heatmap-legend";

function RouteHeatmapMap({
  className,
  displayMode,
  journal = false,
}: {
  className?: string;
  displayMode: RouteHeatmapDisplayMode;
  journal?: boolean;
}) {
  const { mode } = useThemePreset();
  const [locationStatus, setLocationStatus] = useState<
    "fallback" | "located" | "locating"
  >("locating");

  return (
    <div
      className={cn(
        "relative min-h-0 flex-1 overflow-hidden border-border/50 bg-muted/20 [&_.leaflet-bar_a:hover]:bg-accent [&_.leaflet-bar_a]:border-border [&_.leaflet-bar_a]:bg-background/90 [&_.leaflet-bar_a]:text-foreground [&_.leaflet-control-attribution]:bg-background/80 [&_.leaflet-control-attribution]:text-muted-foreground",
        journal
          ? "border-y [&_.leaflet-control-attribution]:mb-0"
          : "rounded-3xl border shadow-xs [&_.leaflet-control-attribution]:mb-14",
      )}
    >
      <MapContainer
        center={routeHeatmapFallbackCenter}
        className={cn("h-[calc(100svh-13rem)] min-h-128 w-full", className)}
        maxZoom={18}
        minZoom={routeHeatmapMinMaterializedZoom}
        preferCanvas
        scrollWheelZoom
        style={{ background: "var(--color-muted)" }}
        zoom={routeHeatmapInitialLocationZoom}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          keepBuffer={6}
          key={mode}
          url={`https://tiles.stadiamaps.com/tiles/alidade_smooth${mode === "dark" ? "_dark" : ""}/{z}/{x}/{y}{r}.png`}
        />
        <TileLayer
          attribution="Route heatmap"
          keepBuffer={8}
          key={displayMode}
          maxNativeZoom={routeHeatmapMaxMaterializedZoom}
          minNativeZoom={routeHeatmapMinMaterializedZoom}
          opacity={0.92}
          updateInterval={100}
          updateWhenIdle={false}
          url={`${getServerUrl()}/api/activities/route-heatmap/tiles/{z}/{x}/{y}.png?mode=${displayMode}`}
        />
        <InitialUserLocationView onStatusChange={setLocationStatus} />
      </MapContainer>
      {journal ? <LocationStatus status={locationStatus} /> : null}
      <RouteHeatmapLegend displayMode={displayMode} journal={journal} />
    </div>
  );
}

function LocationStatus({
  status,
}: {
  status: "fallback" | "located" | "locating";
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute top-4 right-4 z-1000 inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/90 px-3 py-1.5 text-foreground text-xs shadow-xs backdrop-blur-sm"
    >
      {status === "locating" ? (
        <Loader2Icon className="size-3.5 animate-spin text-journal-route" />
      ) : (
        <LocateFixedIcon className="size-3.5 text-journal-route" />
      )}
      {status === "locating"
        ? "Finding your starting view"
        : status === "located"
          ? "Started near your location"
          : "Showing the Brisbane trail"}
    </div>
  );
}

export { RouteHeatmapMap };
