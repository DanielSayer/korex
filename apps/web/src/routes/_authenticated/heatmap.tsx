import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ErrorMessage } from "@/components/error-message";
import { RouteHeatmapMap } from "@/features/route-heatmap/components/route-heatmap-map";
import {
  routeHeatmapCellsPerTile,
  routeHeatmapMinMaterializedZoom,
} from "@/features/route-heatmap/constants";
import type { RouteHeatmapViewport } from "@/features/route-heatmap/types";
import { getRouteHeatmapInput } from "@/features/route-heatmap/utils/route-heatmap-input";
import { buildRouteHeatmapSegments } from "@/features/route-heatmap/utils/route-heatmap-segments";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/heatmap")({
  component: RouteComponent,
});

function RouteComponent() {
  const [viewport, setViewport] = useState<RouteHeatmapViewport | null>(null);
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
        zoom: routeHeatmapMinMaterializedZoom,
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
      buildRouteHeatmapSegments({
        cells,
        cellsPerTile:
          heatmapQuery.data?.cellsPerTile ?? routeHeatmapCellsPerTile,
        zoom: heatmapQuery.data?.zoom ?? routeHeatmapMinMaterializedZoom,
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
      <RouteHeatmapMap
        isFetching={heatmapQuery.isFetching}
        maxActivityCount={maxActivityCount}
        onViewportChange={setViewport}
        segments={heatmapSegments}
      />
    </div>
  );
}
