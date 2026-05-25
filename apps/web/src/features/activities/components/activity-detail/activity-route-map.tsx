import type { ActivityMapInput } from "@korex/api/modules/activities/activities.types";
import { useEffect } from "react";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

type ActivityRouteMapProps = {
  map: ActivityMapInput | null;
};

function ActivityRouteMap({ map }: ActivityRouteMapProps) {
  if (!map || map.coordinates.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border bg-muted text-muted-foreground text-sm">
        Route unavailable
      </div>
    );
  }

  const positions = map.coordinates.map((coordinate) => [
    coordinate.latitude,
    coordinate.longitude,
  ]) satisfies [number, number][];
  const center = positions[Math.floor(positions.length / 2)] ?? positions[0];

  return (
    <div className="h-full overflow-hidden rounded-lg border">
      <MapContainer
        center={center}
        className="h-full w-full"
        maxZoom={18}
        preferCanvas
        scrollWheelZoom
        zoom={10}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
        <Polyline
          pathOptions={{ color: "#22c55e", opacity: 0.95, weight: 4 }}
          positions={positions}
        />
        <FitActivityBounds bounds={map.bounds} positions={positions} />
      </MapContainer>
    </div>
  );
}

function FitActivityBounds({
  bounds,
  positions,
}: {
  bounds: ActivityMapInput["bounds"];
  positions: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(
        [
          [bounds.southWest.latitude, bounds.southWest.longitude],
          [bounds.northEast.latitude, bounds.northEast.longitude],
        ],
        { padding: [24, 24] },
      );
    } else if (positions.length > 1) {
      map.fitBounds(positions, { padding: [24, 24] });
    }
  }, [bounds, map, positions]);

  return null;
}

export { ActivityRouteMap };
