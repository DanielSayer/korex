import { Polyline } from "react-leaflet";
import type { RouteHeatmapSegment } from "../types";
import {
  getRouteHeatmapColor,
  getRouteHeatmapCoreOpacity,
  getRouteHeatmapCoreWeight,
  getRouteHeatmapGlowOpacity,
  getRouteHeatmapGlowWeight,
} from "../utils/route-heatmap-style";

type RouteHeatmapLinesProps = {
  maxActivityCount: number;
  segments: RouteHeatmapSegment[];
};

function RouteHeatmapLines({
  maxActivityCount,
  segments,
}: RouteHeatmapLinesProps) {
  return (
    <>
      {segments.map((segment) => (
        <Polyline
          color={getRouteHeatmapColor(segment.activityCount, maxActivityCount)}
          interactive={false}
          key={`glow:${segment.key}`}
          opacity={getRouteHeatmapGlowOpacity(
            segment.activityCount,
            maxActivityCount,
          )}
          pathOptions={{
            lineCap: "round",
            lineJoin: "round",
          }}
          positions={segment.positions}
          smoothFactor={1.5}
          weight={getRouteHeatmapGlowWeight(
            segment.activityCount,
            maxActivityCount,
          )}
        />
      ))}
      {segments.map((segment) => (
        <Polyline
          color={getRouteHeatmapColor(segment.activityCount, maxActivityCount)}
          interactive={false}
          key={`core:${segment.key}`}
          opacity={getRouteHeatmapCoreOpacity(
            segment.activityCount,
            maxActivityCount,
          )}
          pathOptions={{
            lineCap: "round",
            lineJoin: "round",
          }}
          positions={segment.positions}
          smoothFactor={1.5}
          weight={getRouteHeatmapCoreWeight(
            segment.activityCount,
            maxActivityCount,
          )}
        />
      ))}
    </>
  );
}

export { RouteHeatmapLines };
