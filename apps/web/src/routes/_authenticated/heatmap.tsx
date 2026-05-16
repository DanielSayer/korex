import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { LatLngBounds } from "leaflet";
import { Loader2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { ErrorMessage } from "@/components/error-message";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/heatmap")({
  component: RouteComponent,
});

const cellsPerTile = 64;
const fallbackMapCenter = [-27.47, 153.03] satisfies [number, number];
const initialLocationZoom = 12;
const minMaterializedZoom = 4;
const maxMaterializedZoom = 15;
const heatmapTilePadding = 1;

type Viewport = {
  bounds: LatLngBounds;
  zoom: number;
};

type RouteHeatmapInput = {
  maxTileX: number;
  maxTileY: number;
  minTileX: number;
  minTileY: number;
  zoom: number;
};

function RouteComponent() {
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const heatmapInput = useMemo(
    () => (viewport ? getRouteHeatmapInput(viewport) : null),
    [viewport],
  );
  const heatmapQuery = useQuery({
    ...orpc.activities.routeHeatmap.queryOptions({
      input: heatmapInput ?? {
        maxTileX: 0,
        maxTileY: 0,
        minTileX: 0,
        minTileY: 0,
        zoom: minMaterializedZoom,
      },
    }),
    enabled: Boolean(heatmapInput),
    placeholderData: keepPreviousData,
  });

  const cells = heatmapQuery.data?.cells ?? [];
  const maxActivityCount = Math.max(
    1,
    ...cells.map((cell) => cell.activityCount),
  );
  const heatmapSegments = useMemo(
    () =>
      buildHeatmapSegments({
        cells,
        cellsPerTile: heatmapQuery.data?.cellsPerTile ?? cellsPerTile,
        zoom: heatmapQuery.data?.zoom ?? minMaterializedZoom,
      }),
    [cells, heatmapQuery.data?.cellsPerTile, heatmapQuery.data?.zoom],
  );

  return (
    <div className="flex min-h-[calc(100svh-8.5rem)] flex-col gap-4">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Heatmap</h1>
        <p className="text-muted-foreground text-sm">
          Run frequency across your saved routes.
        </p>
      </div>
      {heatmapQuery.isError ? (
        <ErrorMessage
          message="Could not load route heatmap."
          variant="banner"
        />
      ) : null}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border bg-background">
        <MapContainer
          center={fallbackMapCenter}
          className="h-[calc(100svh-13rem)] min-h-128 w-full"
          maxZoom={18}
          minZoom={3}
          preferCanvas
          scrollWheelZoom
          zoom={initialLocationZoom}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          />
          <InitialUserLocationView onViewportChange={setViewport} />
          <MapViewportReporter onViewportChange={setViewport} />
          {heatmapSegments.map((segment) => (
            <Polyline
              color={getHeatmapColor(segment.activityCount, maxActivityCount)}
              interactive={false}
              key={`glow:${segment.key}`}
              opacity={getHeatmapGlowOpacity(
                segment.activityCount,
                maxActivityCount,
              )}
              pathOptions={{
                lineCap: "round",
                lineJoin: "round",
              }}
              positions={segment.positions}
              smoothFactor={1.5}
              weight={getHeatmapGlowWeight(
                segment.activityCount,
                maxActivityCount,
              )}
            />
          ))}
          {heatmapSegments.map((segment) => (
            <Polyline
              color={getHeatmapColor(segment.activityCount, maxActivityCount)}
              interactive={false}
              key={`core:${segment.key}`}
              opacity={getHeatmapCoreOpacity(
                segment.activityCount,
                maxActivityCount,
              )}
              pathOptions={{
                lineCap: "round",
                lineJoin: "round",
              }}
              positions={segment.positions}
              smoothFactor={1.5}
              weight={getHeatmapCoreWeight(
                segment.activityCount,
                maxActivityCount,
              )}
            />
          ))}
        </MapContainer>
        {heatmapQuery.isFetching ? (
          <div className="absolute top-3 right-3 z-1000 inline-flex items-center gap-2 rounded-md border bg-background/90 px-3 py-2 text-muted-foreground text-sm shadow-sm backdrop-blur-sm">
            <Loader2Icon className="size-4 animate-spin" />
            Loading
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InitialUserLocationView({
  onViewportChange,
}: {
  onViewportChange: (viewport: Viewport) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.setView(
          [position.coords.latitude, position.coords.longitude],
          initialLocationZoom,
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

function MapViewportReporter({
  onViewportChange,
}: {
  onViewportChange: (viewport: Viewport) => void;
}) {
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

function getRouteHeatmapInput({ bounds, zoom }: Viewport): RouteHeatmapInput {
  const materializedZoom = clamp(
    Math.round(zoom),
    minMaterializedZoom,
    maxMaterializedZoom,
  );
  const maxTile = 2 ** materializedZoom - 1;
  const northWest = projectLatLngToTile(
    bounds.getNorth(),
    bounds.getWest(),
    materializedZoom,
  );
  const southEast = projectLatLngToTile(
    bounds.getSouth(),
    bounds.getEast(),
    materializedZoom,
  );

  const input = {
    maxTileX: clamp(
      Math.max(northWest.tileX, southEast.tileX) + heatmapTilePadding,
      0,
      maxTile,
    ),
    maxTileY: clamp(
      Math.max(northWest.tileY, southEast.tileY) + heatmapTilePadding,
      0,
      maxTile,
    ),
    minTileX: clamp(
      Math.min(northWest.tileX, southEast.tileX) - heatmapTilePadding,
      0,
      maxTile,
    ),
    minTileY: clamp(
      Math.min(northWest.tileY, southEast.tileY) - heatmapTilePadding,
      0,
      maxTile,
    ),
    zoom: materializedZoom,
  };

  if (getRouteHeatmapTileCount(input) <= 64) {
    return input;
  }

  return {
    maxTileX: clamp(Math.max(northWest.tileX, southEast.tileX), 0, maxTile),
    maxTileY: clamp(Math.max(northWest.tileY, southEast.tileY), 0, maxTile),
    minTileX: clamp(Math.min(northWest.tileX, southEast.tileX), 0, maxTile),
    minTileY: clamp(Math.min(northWest.tileY, southEast.tileY), 0, maxTile),
    zoom: materializedZoom,
  };
}

function getRouteHeatmapTileCount(input: RouteHeatmapInput) {
  return (
    (input.maxTileX - input.minTileX + 1) *
    (input.maxTileY - input.minTileY + 1)
  );
}

function projectLatLngToTile(
  latitude: number,
  longitude: number,
  zoom: number,
) {
  const tileCount = 2 ** zoom;
  const normalizedLongitude = ((((longitude + 180) % 360) + 360) % 360) - 180;
  const sinLatitude = Math.sin(
    (clamp(latitude, -85.05112878, 85.05112878) * Math.PI) / 180,
  );
  const x = ((normalizedLongitude + 180) / 360) * tileCount;
  const y =
    (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
    tileCount;

  return {
    tileX: Math.floor(clamp(x, 0, tileCount - Number.EPSILON)),
    tileY: Math.floor(clamp(y, 0, tileCount - Number.EPSILON)),
  };
}

function getCellCenter({
  cell,
  cellsPerTile: responseCellsPerTile = cellsPerTile,
  zoom,
}: {
  cell: {
    cellX: number;
    cellY: number;
    tileX: number;
    tileY: number;
  };
  cellsPerTile: number | undefined;
  zoom: number;
}) {
  const zoomCellCount = 2 ** zoom * responseCellsPerTile;
  const globalCellX = cell.tileX * responseCellsPerTile + cell.cellX + 0.5;
  const globalCellY = cell.tileY * responseCellsPerTile + cell.cellY + 0.5;
  const longitude = (globalCellX / zoomCellCount) * 360 - 180;
  const mercatorY = Math.PI * (1 - (2 * globalCellY) / zoomCellCount);
  const latitude = (Math.atan(Math.sinh(mercatorY)) * 180) / Math.PI;

  return [latitude, longitude] satisfies [number, number];
}

type HeatmapCell = {
  activityCount: number;
  cellX: number;
  cellY: number;
  tileX: number;
  tileY: number;
};

type HeatmapSegment = {
  activityCount: number;
  key: string;
  positions: [[number, number], [number, number]];
};

function buildHeatmapSegments({
  cells,
  cellsPerTile: responseCellsPerTile,
  zoom,
}: {
  cells: HeatmapCell[];
  cellsPerTile: number;
  zoom: number;
}) {
  const cellsByGlobalKey = new Map<string, HeatmapCell>();
  const segments: HeatmapSegment[] = [];

  for (const cell of cells) {
    cellsByGlobalKey.set(
      getGlobalCellKey({ cell, cellsPerTile: responseCellsPerTile }),
      cell,
    );
  }

  for (const cell of cells) {
    const globalCell = getGlobalCellPosition({
      cell,
      cellsPerTile: responseCellsPerTile,
    });
    const neighbors = [
      [globalCell.x + 1, globalCell.y],
      [globalCell.x, globalCell.y + 1],
      [globalCell.x + 1, globalCell.y + 1],
      [globalCell.x - 1, globalCell.y + 1],
    ];

    for (const [neighborX, neighborY] of neighbors) {
      const neighbor = cellsByGlobalKey.get(`${neighborX}:${neighborY}`);

      if (!neighbor) {
        continue;
      }

      segments.push({
        activityCount: Math.max(cell.activityCount, neighbor.activityCount),
        key: `${globalCell.x}:${globalCell.y}-${neighborX}:${neighborY}`,
        positions: [
          getCellCenter({
            cell,
            cellsPerTile: responseCellsPerTile,
            zoom,
          }),
          getCellCenter({
            cell: neighbor,
            cellsPerTile: responseCellsPerTile,
            zoom,
          }),
        ],
      });
    }
  }

  return segments;
}

function getGlobalCellKey({
  cell,
  cellsPerTile: responseCellsPerTile,
}: {
  cell: HeatmapCell;
  cellsPerTile: number;
}) {
  const globalCell = getGlobalCellPosition({
    cell,
    cellsPerTile: responseCellsPerTile,
  });

  return `${globalCell.x}:${globalCell.y}`;
}

function getGlobalCellPosition({
  cell,
  cellsPerTile: responseCellsPerTile,
}: {
  cell: HeatmapCell;
  cellsPerTile: number;
}) {
  return {
    x: cell.tileX * responseCellsPerTile + cell.cellX,
    y: cell.tileY * responseCellsPerTile + cell.cellY,
  };
}

function getHeatmapColor(activityCount: number, maxActivityCount: number) {
  const intensity = activityCount / maxActivityCount;

  if (intensity > 0.66) {
    return "#ef4444";
  }

  if (intensity > 0.33) {
    return "#f97316";
  }

  return "#facc15";
}

function getHeatmapGlowOpacity(
  activityCount: number,
  maxActivityCount: number,
) {
  return 0.12 + (activityCount / maxActivityCount) * 0.2;
}

function getHeatmapCoreOpacity(
  activityCount: number,
  maxActivityCount: number,
) {
  return 0.48 + (activityCount / maxActivityCount) * 0.26;
}

function getHeatmapGlowWeight(activityCount: number, maxActivityCount: number) {
  return 10 + (activityCount / maxActivityCount) * 10;
}

function getHeatmapCoreWeight(activityCount: number, maxActivityCount: number) {
  return 3 + (activityCount / maxActivityCount) * 4;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
