import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { routeHeatmapInitialLocationZoom } from "../constants";

function InitialUserLocationView({
  onStatusChange,
}: {
  onStatusChange?: (status: "fallback" | "located") => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) {
      onStatusChange?.("fallback");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.setView(
          [position.coords.latitude, position.coords.longitude],
          routeHeatmapInitialLocationZoom,
        );
        onStatusChange?.("located");
      },
      () => onStatusChange?.("fallback"),
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: 5000,
      },
    );
  }, [map, onStatusChange]);

  return null;
}

export { InitialUserLocationView };
