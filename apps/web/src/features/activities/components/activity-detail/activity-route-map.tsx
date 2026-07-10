import type { ActivityMapInput } from "@korex/api/modules/activities/activities.types";
import { useTheme } from "next-themes";
import { useEffect, useMemo } from "react";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import { cn } from "@/lib/utils";

type ActivityRouteMapProps = {
  className?: string;
  compactAttribution?: boolean;
  desktop?: boolean;
  map: ActivityMapInput | null;
};

const emptyCoordinates: ActivityMapInput["coordinates"] = [];

function ActivityRouteMap({
  className,
  compactAttribution = false,
  desktop = false,
  map,
}: ActivityRouteMapProps) {
  const { resolvedTheme } = useTheme();
  const coordinates = map?.coordinates ?? emptyCoordinates;
  const positions = useMemo(
    () =>
      coordinates.map((coordinate) => [
        coordinate.latitude,
        coordinate.longitude,
      ]) satisfies [number, number][],
    [coordinates],
  );

  if (!map || positions.length === 0) {
    return (
      <div
        className={cn(
          "flex h-96 items-center justify-center bg-muted/30 text-muted-foreground text-sm",
          !desktop && "rounded-lg border",
          className,
        )}
      >
        Route unavailable
      </div>
    );
  }
  const center = positions[Math.floor(positions.length / 2)] ?? positions[0];

  return (
    <div
      className={cn(
        "relative h-full min-h-64 overflow-hidden",
        !desktop && "rounded-lg border",
        className,
      )}
    >
      <MapContainer
        attributionControl={!compactAttribution}
        center={center}
        className="h-full w-full"
        maxZoom={18}
        preferCanvas
        scrollWheelZoom
        zoomControl={!compactAttribution}
        zoom={10}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={`https://tiles.stadiamaps.com/tiles/${desktop && resolvedTheme !== "dark" ? "alidade_smooth" : "alidade_smooth_dark"}/{z}/{x}/{y}{r}.png`}
        />
        <Polyline
          pathOptions={{
            className: desktop ? "stroke-journal-route" : "stroke-primary",
            opacity: 0.95,
            weight: 4,
          }}
          positions={positions}
        />
        <FitActivityBounds bounds={map.bounds} positions={positions} />
      </MapContainer>
      {compactAttribution ? <CompactMapAttribution /> : null}
    </div>
  );
}

function CompactMapAttribution() {
  return (
    <details className="absolute right-2 bottom-2 z-[500] max-w-[calc(100%-1rem)] rounded-md bg-background/85 text-foreground text-xs shadow-sm backdrop-blur">
      <summary className="cursor-pointer list-none px-2 py-1 text-muted-foreground">
        Map data
      </summary>
      <div className="flex flex-wrap gap-x-1 px-2 pb-1">
        <a
          className="underline underline-offset-2"
          href="https://www.stadiamaps.com/"
          rel="noreferrer"
          target="_blank"
        >
          Stadia Maps
        </a>
        <span>/</span>
        <a
          className="underline underline-offset-2"
          href="https://openmaptiles.org/"
          rel="noreferrer"
          target="_blank"
        >
          OpenMapTiles
        </a>
        <span>/</span>
        <a
          className="underline underline-offset-2"
          href="https://www.openstreetmap.org/copyright"
          rel="noreferrer"
          target="_blank"
        >
          OpenStreetMap
        </a>
      </div>
    </details>
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
