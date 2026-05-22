import { env } from "@korex/env/web";
import { MapContainer, TileLayer } from "react-leaflet";
import {
  routeHeatmapFallbackCenter,
  routeHeatmapInitialLocationZoom,
  routeHeatmapMaxMaterializedZoom,
  routeHeatmapMinMaterializedZoom,
} from "../constants";
import { InitialUserLocationView } from "./initial-user-location-view";
import { RouteHeatmapLegend } from "./route-heatmap-legend";

function RouteHeatmapMap() {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border bg-background">
      <MapContainer
        center={routeHeatmapFallbackCenter}
        className="h-[calc(100svh-13rem)] min-h-128 w-full"
        maxZoom={18}
        minZoom={routeHeatmapMinMaterializedZoom}
        preferCanvas
        scrollWheelZoom
        style={{ background: "#111827" }}
        zoom={routeHeatmapInitialLocationZoom}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          keepBuffer={6}
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
        <TileLayer
          attribution="Route heatmap"
          keepBuffer={8}
          maxNativeZoom={routeHeatmapMaxMaterializedZoom}
          minNativeZoom={routeHeatmapMinMaterializedZoom}
          opacity={0.92}
          updateInterval={100}
          updateWhenIdle={false}
          url={`${env.VITE_SERVER_URL}/api/activities/route-heatmap/tiles/{z}/{x}/{y}.png`}
        />
        <InitialUserLocationView />
      </MapContainer>
      <RouteHeatmapLegend />
    </div>
  );
}

export { RouteHeatmapMap };
