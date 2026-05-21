import { calculateActivityRouteHeatmapCellDeltas } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-projection";
import { describe, expect, it } from "vitest";

describe("activity route heatmap projection", () => {
  it("returns positive deltas for new contribution cells", () => {
    const deltas = calculateActivityRouteHeatmapCellDeltas({
      contributions: [
        { cellX: 1, cellY: 2, tileX: 3, tileY: 4, zoom: 10 },
        { cellX: 5, cellY: 6, tileX: 7, tileY: 8, zoom: 10 },
      ],
      existingContributions: [],
    });

    expect(deltas).toEqual([
      { cellX: 1, cellY: 2, delta: 1, tileX: 3, tileY: 4, zoom: 10 },
      { cellX: 5, cellY: 6, delta: 1, tileX: 7, tileY: 8, zoom: 10 },
    ]);
  });

  it("returns negative deltas for removed contribution cells", () => {
    const deltas = calculateActivityRouteHeatmapCellDeltas({
      contributions: [],
      existingContributions: [
        { cellX: 1, cellY: 2, tileX: 3, tileY: 4, zoom: 10 },
        { cellX: 5, cellY: 6, tileX: 7, tileY: 8, zoom: 10 },
      ],
    });

    expect(deltas).toEqual([
      { cellX: 1, cellY: 2, delta: -1, tileX: 3, tileY: 4, zoom: 10 },
      { cellX: 5, cellY: 6, delta: -1, tileX: 7, tileY: 8, zoom: 10 },
    ]);
  });

  it("combines duplicate contribution cells into a single delta", () => {
    const deltas = calculateActivityRouteHeatmapCellDeltas({
      contributions: [
        { cellX: 1, cellY: 2, tileX: 3, tileY: 4, zoom: 10 },
        { cellX: 1, cellY: 2, tileX: 3, tileY: 4, zoom: 10 },
      ],
      existingContributions: [
        { cellX: 5, cellY: 6, tileX: 7, tileY: 8, zoom: 10 },
        { cellX: 5, cellY: 6, tileX: 7, tileY: 8, zoom: 10 },
      ],
    });

    expect(deltas).toEqual([
      { cellX: 5, cellY: 6, delta: -2, tileX: 7, tileY: 8, zoom: 10 },
      { cellX: 1, cellY: 2, delta: 2, tileX: 3, tileY: 4, zoom: 10 },
    ]);
  });

  it("omits cells whose replacement has no net aggregate change", () => {
    const deltas = calculateActivityRouteHeatmapCellDeltas({
      contributions: [
        { cellX: 1, cellY: 2, tileX: 3, tileY: 4, zoom: 10 },
        { cellX: 9, cellY: 9, tileX: 9, tileY: 9, zoom: 11 },
      ],
      existingContributions: [
        { cellX: 1, cellY: 2, tileX: 3, tileY: 4, zoom: 10 },
        { cellX: 5, cellY: 6, tileX: 7, tileY: 8, zoom: 10 },
      ],
    });

    expect(deltas).toEqual([
      { cellX: 5, cellY: 6, delta: -1, tileX: 7, tileY: 8, zoom: 10 },
      { cellX: 9, cellY: 9, delta: 1, tileX: 9, tileY: 9, zoom: 11 },
    ]);
  });
});
