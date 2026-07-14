import { inflateSync } from "node:zlib";
import {
  activityRouteHeatmapColorStops,
  getActivityRouteHeatmapColor,
} from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-color-ramp";
import {
  readActivityRouteHeatmapDisplayMode,
  readActivityRouteHeatmapTileInput,
  renderActivityRouteHeatmapTile,
  renderEmptyActivityRouteHeatmapTile,
} from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-tile";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRouteHeatmapRampCss } from "../../../../../web/src/features/route-heatmap/utils/route-heatmap-style";

const repository = vi.hoisted(() => ({
  getMaxActivityCount: vi.fn(),
  listCells: vi.fn(),
}));

vi.mock(
  "@korex/api/modules/activities/route-heatmap/activity-route-heatmap.repository",
  () => ({
    getActivityRouteHeatmapMaxActivityCount: repository.getMaxActivityCount,
    listActivityRouteHeatmapAggregateCellsForTile: repository.listCells,
  }),
);

describe("activity route heatmap tiles", () => {
  beforeEach(() => {
    repository.getMaxActivityCount.mockReset().mockResolvedValue(10);
    repository.listCells.mockReset().mockResolvedValue([]);
  });

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

  it("preserves the exact shared color stops and interpolation", () => {
    expect(activityRouteHeatmapColorStops).toEqual([
      { color: { b: 18, g: 55, r: 190 }, intensity: 0 },
      { color: { b: 0, g: 132, r: 249 }, intensity: 0.35 },
      { color: { b: 21, g: 204, r: 250 }, intensity: 0.7 },
      { color: { b: 232, g: 248, r: 255 }, intensity: 1 },
    ]);
    expect(getActivityRouteHeatmapColor(-1)).toEqual({ b: 18, g: 55, r: 190 });
    expect(getActivityRouteHeatmapColor(0.12)).toEqual({
      b: 12,
      g: 81,
      r: 210,
    });
    expect(getActivityRouteHeatmapColor(2)).toEqual({
      b: 232,
      g: 248,
      r: 255,
    });
  });

  it("uses the shared server color ramp for the web legend", () => {
    expect(getRouteHeatmapRampCss()).toBe(
      "rgba(190,55,18,0), rgb(210, 81, 12), rgb(249, 132, 0), rgb(250, 204, 21), rgb(255, 248, 232)",
    );
  });

  it("renders visible RGBA output for matching aggregate cells", async () => {
    repository.listCells.mockResolvedValue([routeHeatmapCell(10)]);

    const pixels = readPngPixels(await renderTile());
    const mostOpaquePixel = readMostOpaquePixel(pixels);

    expect(mostOpaquePixel).toEqual({ alpha: 75, b: 69, g: 73, r: 75 });
  });

  it("renders visited cells with constant intensity regardless of activity count", async () => {
    repository.listCells.mockResolvedValue([routeHeatmapCell(1)]);
    const lowCountPixels = readPngPixels(
      await renderTile({ displayMode: "visited" }),
    );

    repository.listCells.mockResolvedValue([routeHeatmapCell(100)]);
    const highCountPixels = readPngPixels(
      await renderTile({ displayMode: "visited" }),
    );

    expect(lowCountPixels).toEqual(highCountPixels);
  });

  it("uses log-scaled density intensity", async () => {
    repository.getMaxActivityCount.mockResolvedValue(100);
    repository.listCells.mockResolvedValue([routeHeatmapCell(1)]);
    const lowCountPixels = readPngPixels(await renderTile());

    repository.listCells.mockResolvedValue([routeHeatmapCell(100)]);
    const highCountPixels = readPngPixels(await renderTile());

    expect(readMostOpaquePixel(lowCountPixels)).toEqual({
      alpha: 27,
      b: 1,
      g: 9,
      r: 23,
    });
    expect(readMostOpaquePixel(highCountPixels)).toEqual({
      alpha: 75,
      b: 69,
      g: 73,
      r: 75,
    });
  });

  it("keeps empty or zero-count tiles transparent", async () => {
    expect(
      readPngPixels(await renderTile()).every((value) => value === 0),
    ).toBe(true);

    repository.getMaxActivityCount.mockResolvedValue(0);
    repository.listCells.mockResolvedValue([routeHeatmapCell(10)]);

    expect(
      readPngPixels(await renderTile()).every((value) => value === 0),
    ).toBe(true);
  });

  it("encodes heatmap tiles as 256px RGBA PNGs", async () => {
    expect(readPngHeader(renderEmptyActivityRouteHeatmapTile())).toEqual({
      bitDepth: 8,
      colorType: 6,
      height: 256,
      signature: "89504e470d0a1a0a",
      width: 256,
    });

    repository.listCells.mockResolvedValue([routeHeatmapCell(10)]);

    expect(readPngHeader(await renderTile())).toEqual({
      bitDepth: 8,
      colorType: 6,
      height: 256,
      signature: "89504e470d0a1a0a",
      width: 256,
    });
  });
});

function renderTile({
  displayMode,
}: {
  displayMode?: "density" | "visited";
} = {}) {
  return renderActivityRouteHeatmapTile({
    displayMode,
    tileX: 3,
    tileY: 4,
    userId: "user-1",
    zoom: 4,
  });
}

function routeHeatmapCell(activityCount: number) {
  return {
    activityCount,
    cellX: 10,
    cellY: 12,
    tileX: 3,
    tileY: 4,
  };
}

function readMostOpaquePixel(pixels: Uint8Array) {
  let offset = 0;

  for (let index = 4; index < pixels.length; index += 4) {
    if ((pixels[index + 3] ?? 0) > (pixels[offset + 3] ?? 0)) {
      offset = index;
    }
  }

  return {
    alpha: pixels[offset + 3],
    b: pixels[offset + 2],
    g: pixels[offset + 1],
    r: pixels[offset],
  };
}

function readPngPixels(buffer: Buffer) {
  const idatChunks: Buffer[] = [];
  let offset = 8;

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");

    if (type === "IDAT") {
      idatChunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    }

    offset += 12 + length;
  }

  const raw = inflateSync(Buffer.concat(idatChunks));
  const pixels = new Uint8Array(256 * 256 * 4);
  const rowLength = 256 * 4 + 1;

  for (let y = 0; y < 256; y += 1) {
    expect(raw[y * rowLength]).toBe(0);
    pixels.set(
      raw.subarray(y * rowLength + 1, (y + 1) * rowLength),
      y * 256 * 4,
    );
  }

  return pixels;
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
