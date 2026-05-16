import {
  activityRouteHeatmapCellsPerTile,
  calculateActivityRouteHeatmapContributions,
  getCellKey,
  perpendicularDistance,
  projectCoordinateToGlobalCellSpace,
  rasterizeSegment,
  readCellKey,
  simplifyProjectedPoints,
  toContribution,
} from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap";
import { describe, expect, it } from "vitest";

describe("activity route heatmap", () => {
  it("deduplicates one activity's repeated contribution to the same cell", () => {
    const contributions = calculateActivityRouteHeatmapContributions({
      coordinates: [
        { latitude: -27.581491, longitude: 153.06828 },
        { latitude: -27.581491, longitude: 153.06828 },
        { latitude: -27.581491, longitude: 153.06828 },
      ],
      zoomLevels: [15],
    });

    expect(contributions).toHaveLength(1);
    expect(contributions[0]).toMatchObject({
      zoom: 15,
    });
  });

  it("rasterizes route segments through intermediate cells", () => {
    const contributions = calculateActivityRouteHeatmapContributions({
      coordinates: [
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
      ],
      zoomLevels: [10],
    });

    expect(contributions.length).toBeGreaterThan(2);
    expect(
      contributions.every(
        (contribution) =>
          contribution.cellX >= 0 &&
          contribution.cellX < activityRouteHeatmapCellsPerTile &&
          contribution.cellY >= 0 &&
          contribution.cellY < activityRouteHeatmapCellsPerTile,
      ),
    ).toBe(true);
  });

  it("calculates contributions for every requested zoom", () => {
    const contributions = calculateActivityRouteHeatmapContributions({
      coordinates: [
        { latitude: -27.581491, longitude: 153.06828 },
        { latitude: -27.581144, longitude: 153.06902 },
      ],
      zoomLevels: [4, 5],
    });

    expect(
      new Set(contributions.map((contribution) => contribution.zoom)),
    ).toEqual(new Set([4, 5]));
  });

  it("projects coordinates into global cell space at a zoom level", () => {
    expect(
      projectCoordinateToGlobalCellSpace({ latitude: 0, longitude: 0 }, 4),
    ).toEqual({ x: 512, y: 512 });
    expect(
      projectCoordinateToGlobalCellSpace({ latitude: 0, longitude: -180 }, 4),
    ).toEqual({ x: 0, y: 512 });
    expect(
      projectCoordinateToGlobalCellSpace({ latitude: 0, longitude: 180 }, 4),
    ).toEqual({ x: 0, y: 512 });
  });

  it("clamps projected latitude to the web mercator limits", () => {
    const north = projectCoordinateToGlobalCellSpace(
      { latitude: 90, longitude: 0 },
      4,
    );
    const south = projectCoordinateToGlobalCellSpace(
      { latitude: -90, longitude: 0 },
      4,
    );

    expect(north.y).toBe(0);
    expect(south.y).toBe(1023);
  });

  it("converts global cells into tile-local contribution cells", () => {
    expect(
      toContribution({
        globalCellX: 130,
        globalCellY: 191,
        zoom: 4,
      }),
    ).toEqual({
      cellX: 2,
      cellY: 63,
      tileX: 2,
      tileY: 2,
      zoom: 4,
    });
  });

  it("round-trips and validates cell keys", () => {
    const key = getCellKey({ x: 12, y: 34 });

    expect(key).toBe("12:34");
    expect(readCellKey(key)).toEqual({ x: 12, y: 34 });
    expect(() => readCellKey("12")).toThrow(
      "Invalid Activity Route Heatmap cell key",
    );
    expect(() => readCellKey("x:34")).toThrow(
      "Invalid Activity Route Heatmap cell key",
    );
  });

  it("deduplicates consecutive projected points before simplifying", () => {
    expect(
      simplifyProjectedPoints(
        [
          { x: 1, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 2 },
        ],
        0.5,
      ),
    ).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);
  });

  it("simplifies near-straight projected points within tolerance", () => {
    expect(
      simplifyProjectedPoints(
        [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          { x: 10, y: 0 },
        ],
        0.5,
      ),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
  });

  it("keeps projected points that change the path beyond tolerance", () => {
    expect(
      simplifyProjectedPoints(
        [
          { x: 0, y: 0 },
          { x: 5, y: 4 },
          { x: 10, y: 0 },
        ],
        0.5,
      ),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 4 },
      { x: 10, y: 0 },
    ]);
  });

  it("calculates perpendicular distance from a point to a segment", () => {
    expect(
      perpendicularDistance({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 }),
    ).toBe(3);
    expect(
      perpendicularDistance({ x: 4, y: 5 }, { x: 2, y: 3 }, { x: 2, y: 3 }),
    ).toBeCloseTo(Math.hypot(2, 2));
  });

  it("rasterizes horizontal, vertical, and diagonal segments", () => {
    expect(rasterizeSegment({ x: 1, y: 2 }, { x: 4, y: 2 })).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ]);
    expect(rasterizeSegment({ x: 3, y: 5 }, { x: 3, y: 2 })).toEqual([
      { x: 3, y: 5 },
      { x: 3, y: 4 },
      { x: 3, y: 3 },
      { x: 3, y: 2 },
    ]);
    expect(rasterizeSegment({ x: 0, y: 0 }, { x: 3, y: 3 })).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]);
  });
});
