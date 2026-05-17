import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { routeHeatmapInitialLocationZoom } from "../constants";

function InitialUserLocationView() {
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
      },
      () => undefined,
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: 5000,
      },
    );
  }, [map]);

  return null;
}

export { InitialUserLocationView };
