import {
  calculateActivityRouteHeatmapCellDeltas,
  decodeActivityRouteHeatmapCell,
  encodeActivityRouteHeatmapCell,
  packActivityRouteHeatmapContributionSets,
  unpackActivityRouteHeatmapContributionSets,
} from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-projection";
import { describe, expect, it } from "vitest";

describe("activity route heatmap projection", () => {
  it("round-trips a packed cell coordinate", () => {
    const contribution = {
      cellX: 63,
      cellY: 7,
      tileX: 32_767,
      tileY: 18_997,
      zoom: 15,
    };

    expect(
      decodeActivityRouteHeatmapCell({
        cellKey: encodeActivityRouteHeatmapCell(contribution),
        zoom: contribution.zoom,
      }),
    ).toEqual(contribution);
  });

  it("packs one sorted, deduplicated contribution set per zoom", () => {
    const contributions = [
      { cellX: 5, cellY: 6, tileX: 7, tileY: 8, zoom: 10 },
      { cellX: 1, cellY: 2, tileX: 3, tileY: 4, zoom: 9 },
      { cellX: 1, cellY: 2, tileX: 3, tileY: 4, zoom: 9 },
    ];

    const contributionSets =
      packActivityRouteHeatmapContributionSets(contributions);

    expect(
      contributionSets.map(({ cellKeys, zoom }) => ({
        cellCount: cellKeys.length,
        zoom,
      })),
    ).toEqual([
      { cellCount: 1, zoom: 9 },
      { cellCount: 1, zoom: 10 },
    ]);
    expect(
      unpackActivityRouteHeatmapContributionSets(contributionSets),
    ).toEqual([contributions[1], contributions[0]]);
  });

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
