import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { RouteHeatmapViewport } from "../types";

type MapViewportReporterProps = {
  onViewportChange: (viewport: RouteHeatmapViewport) => void;
};

function MapViewportReporter({ onViewportChange }: MapViewportReporterProps) {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      onViewportChange({ bounds: map.getBounds(), zoom: map.getZoom() });
    },
    zoomend: () => {
      onViewportChange({ bounds: map.getBounds(), zoom: map.getZoom() });
    },
  });

  useEffect(() => {
    onViewportChange({ bounds: map.getBounds(), zoom: map.getZoom() });
  }, [map, onViewportChange]);

  return null;
}

export { MapViewportReporter };
