import {
  getActivityRouteHeatmapTileIntensity,
  readActivityRouteHeatmapDisplayMode,
  readActivityRouteHeatmapTileInput,
  renderActivityRouteHeatmapTileImage,
  renderActivityRouteHeatmapTilePixels,
  renderEmptyActivityRouteHeatmapTile,
} from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-tile";
import { describe, expect, it } from "vitest";

describe("activity route heatmap tiles", () => {
  it("normalizes leaflet tile parameters into supported materialized tiles", () => {
    expect(
      readActivityRouteHeatmapTileInput({
        tileX: "-1",
        tileY: "0.png",
        zoom: "4",
      }),
    ).toEqual({
      tileX: 15,
      tileY: 0,
      zoom: 4,
    });

    expect(
      readActivityRouteHeatmapTileInput({
        tileX: "131068",
        tileY: "131068",
        zoom: "17",
      }),
    ).toEqual({
      tileX: 32767,
      tileY: 32767,
      zoom: 15,
    });

    expect(
      readActivityRouteHeatmapTileInput({
        tileX: "1",
        tileY: "1",
        zoom: "3",
      }),
    ).toEqual({
      tileX: 2,
      tileY: 2,
      zoom: 4,
    });
  });

  it("returns no tile for invalid or vertically out-of-range requests", () => {
    expect(
      readActivityRouteHeatmapTileInput({
        tileX: "1",
        tileY: "-1",
        zoom: "4",
      }),
    ).toBeNull();
    expect(
      readActivityRouteHeatmapTileInput({
        tileX: "1",
        tileY: "16",
        zoom: "4",
      }),
    ).toBeNull();
    expect(
      readActivityRouteHeatmapTileInput({
        tileX: "not-a-number",
        tileY: "1",
        zoom: "4",
      }),
    ).toBeNull();
  });

  it("defaults invalid display modes to density", () => {
    expect(readActivityRouteHeatmapDisplayMode(undefined)).toBe("density");
    expect(readActivityRouteHeatmapDisplayMode("not-a-mode")).toBe("density");
    expect(readActivityRouteHeatmapDisplayMode("density")).toBe("density");
    expect(readActivityRouteHeatmapDisplayMode("visited")).toBe("visited");
  });

  it("uses log intensity so dense cells do not dominate the whole ramp", () => {
    expect(
      getActivityRouteHeatmapTileIntensity({
        activityCount: 0,
        maxActivityCount: 100,
      }),
    ).toBe(0);
    expect(
      getActivityRouteHeatmapTileIntensity({
        activityCount: 10,
        maxActivityCount: 100,
      }),
    ).toBeCloseTo(Math.log1p(10) / Math.log1p(100));
    expect(
      getActivityRouteHeatmapTileIntensity({
        activityCount: 100,
        maxActivityCount: 100,
      }),
    ).toBe(1);
  });

  it("renders visible alpha for matching aggregate cells", () => {
    const pixels = renderActivityRouteHeatmapTilePixels({
      cells: [
        {
          activityCount: 10,
          cellX: 10,
          cellY: 12,
          tileX: 3,
          tileY: 4,
        },
      ],
      maxActivityCount: 10,
      tileX: 3,
      tileY: 4,
    });
    const alphaValues = readAlphaValues(pixels);

    expect(alphaValues.some((alpha) => alpha > 0)).toBe(true);
  });

  it("renders visited cells with constant intensity regardless of activity count", () => {
    const lowCountPixels = renderActivityRouteHeatmapTilePixels({
      cells: [
        {
          activityCount: 1,
          cellX: 10,
          cellY: 12,
          tileX: 3,
          tileY: 4,
        },
      ],
      displayMode: "visited",
      maxActivityCount: 100,
      tileX: 3,
      tileY: 4,
    });
    const highCountPixels = renderActivityRouteHeatmapTilePixels({
      cells: [
        {
          activityCount: 100,
          cellX: 10,
          cellY: 12,
          tileX: 3,
          tileY: 4,
        },
      ],
      displayMode: "visited",
      maxActivityCount: 100,
      tileX: 3,
      tileY: 4,
    });

    expect(readMaxAlpha(lowCountPixels)).toBe(readMaxAlpha(highCountPixels));
  });

  it("keeps empty or zero-count tiles transparent", () => {
    expect(
      readAlphaValues(
        renderActivityRouteHeatmapTilePixels({
          cells: [],
          maxActivityCount: 10,
          tileX: 3,
          tileY: 4,
        }),
      ).every((alpha) => alpha === 0),
    ).toBe(true);
    expect(
      readAlphaValues(
        renderActivityRouteHeatmapTilePixels({
          cells: [
            {
              activityCount: 10,
              cellX: 10,
              cellY: 12,
              tileX: 3,
              tileY: 4,
            },
          ],
          maxActivityCount: 0,
          tileX: 3,
          tileY: 4,
        }),
      ).every((alpha) => alpha === 0),
    ).toBe(true);
  });

  it("encodes heatmap tiles as 256px RGBA PNGs", () => {
    expect(readPngHeader(renderEmptyActivityRouteHeatmapTile())).toEqual({
      bitDepth: 8,
      colorType: 6,
      height: 256,
      signature: "89504e470d0a1a0a",
      width: 256,
    });
    expect(
      readPngHeader(
        renderActivityRouteHeatmapTileImage({
          cells: [
            {
              activityCount: 10,
              cellX: 10,
              cellY: 12,
              tileX: 3,
              tileY: 4,
            },
          ],
          maxActivityCount: 10,
          tileX: 3,
          tileY: 4,
        }),
      ),
    ).toEqual({
      bitDepth: 8,
      colorType: 6,
      height: 256,
      signature: "89504e470d0a1a0a",
      width: 256,
    });
  });
});

function readAlphaValues(pixels: Uint8Array) {
  const alphaValues: number[] = [];

  for (let index = 3; index < pixels.length; index += 4) {
    alphaValues.push(pixels[index] ?? 0);
  }

  return alphaValues;
}

function readMaxAlpha(pixels: Uint8Array) {
  return Math.max(...readAlphaValues(pixels));
}

function readPngHeader(buffer: Buffer) {
  return {
    bitDepth: buffer[24],
    colorType: buffer[25],
    height: buffer.readUInt32BE(20),
    signature: buffer.subarray(0, 8).toString("hex"),
    width: buffer.readUInt32BE(16),
  };
}
