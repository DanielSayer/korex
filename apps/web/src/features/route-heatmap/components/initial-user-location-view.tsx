import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { routeHeatmapInitialLocationZoom } from "../constants";
import type { RouteHeatmapViewport } from "../types";

type InitialUserLocationViewProps = {
  onViewportChange: (viewport: RouteHeatmapViewport) => void;
};

function InitialUserLocationView({
  onViewportChange,
}: InitialUserLocationViewProps) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.setView(
          [position.coords.latitude, position.coords.longitude],
          routeHeatmapInitialLocationZoom,
        );
        onViewportChange({ bounds: map.getBounds(), zoom: map.getZoom() });
      },
      () => undefined,
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: 5000,
      },
    );
  }, [map, onViewportChange]);

  return null;
}

export { InitialUserLocationView };
