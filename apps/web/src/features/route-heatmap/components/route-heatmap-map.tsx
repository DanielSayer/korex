import { Loader2Icon } from "lucide-react";
import { MapContainer, TileLayer } from "react-leaflet";
import {
  routeHeatmapFallbackCenter,
  routeHeatmapInitialLocationZoom,
} from "../constants";
import type { RouteHeatmapSegment, RouteHeatmapViewport } from "../types";
import { InitialUserLocationView } from "./initial-user-location-view";
import { MapViewportReporter } from "./map-viewport-reporter";
import { RouteHeatmapLines } from "./route-heatmap-lines";

type RouteHeatmapMapProps = {
  isFetching: boolean;
  maxActivityCount: number;
  onViewportChange: (viewport: RouteHeatmapViewport) => void;
  segments: RouteHeatmapSegment[];
};

function RouteHeatmapMap({
  isFetching,
  maxActivityCount,
  onViewportChange,
  segments,
}: RouteHeatmapMapProps) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border bg-background">
      <MapContainer
        center={routeHeatmapFallbackCenter}
        className="h-[calc(100svh-13rem)] min-h-128 w-full"
        maxZoom={18}
        minZoom={3}
        preferCanvas
        scrollWheelZoom
        zoom={routeHeatmapInitialLocationZoom}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
        <InitialUserLocationView onViewportChange={onViewportChange} />
        <MapViewportReporter onViewportChange={onViewportChange} />
        <RouteHeatmapLines
          maxActivityCount={maxActivityCount}
          segments={segments}
        />
      </MapContainer>
      {isFetching ? (
        <div className="absolute top-3 right-3 z-1000 inline-flex items-center gap-2 rounded-md border bg-background/90 px-3 py-2 text-muted-foreground text-sm shadow-sm backdrop-blur-sm">
          <Loader2Icon className="size-4 animate-spin" />
          Loading
        </div>
      ) : null}
    </div>
  );
}

export { RouteHeatmapMap };
