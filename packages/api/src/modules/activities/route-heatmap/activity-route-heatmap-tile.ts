import { deflateSync } from "node:zlib";
import {
  activityRouteHeatmapCellsPerTile,
  activityRouteHeatmapZoomLevels,
} from "./activity-route-heatmap";
import {
  getActivityRouteHeatmapMaxActivityCount,
  listActivityRouteHeatmapAggregateCellsForTile,
} from "./activity-route-heatmap.repository";
import { getActivityRouteHeatmapColor } from "./activity-route-heatmap-color-ramp";

const tileSize = 256;
const minRouteHeatmapZoom = Math.min(...activityRouteHeatmapZoomLevels);
const maxRouteHeatmapZoom = Math.max(...activityRouteHeatmapZoomLevels);

type RenderActivityRouteHeatmapTileInput = {
  displayMode?: ActivityRouteHeatmapDisplayMode;
  tileX: number;
  tileY: number;
  userId: string;
  zoom: number;
};

type ActivityRouteHeatmapTileInput = {
  tileX: number;
  tileY: number;
  zoom: number;
};

const activityRouteHeatmapDisplayModes = ["density", "visited"] as const;

type ActivityRouteHeatmapDisplayMode =
  (typeof activityRouteHeatmapDisplayModes)[number];

export class ActivityRouteHeatmapTileInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivityRouteHeatmapTileInputError";
  }
}

export function readActivityRouteHeatmapDisplayMode(value: string | undefined) {
  if (activityRouteHeatmapDisplayModes.includes(value as never)) {
    return value as ActivityRouteHeatmapDisplayMode;
  }

  return "density";
}

export function readActivityRouteHeatmapTileInput({
  tileX,
  tileY,
  zoom,
}: {
  tileX: string | undefined;
  tileY: string | undefined;
  zoom: string | undefined;
}) {
  const requestedZoom = readTileInteger(zoom);
  const requestedTileX = readTileInteger(tileX, { allowNegative: true });
  const requestedTileY = readTileInteger(tileY);

  if (
    requestedZoom === null ||
    requestedTileX === null ||
    requestedTileY === null
  ) {
    return null;
  }

  if (requestedZoom > maxRouteHeatmapZoom) {
    const factor = 2 ** (requestedZoom - maxRouteHeatmapZoom);

    return normalizeActivityRouteHeatmapTileInput({
      tileX: Math.floor(requestedTileX / factor),
      tileY: Math.floor(requestedTileY / factor),
      zoom: maxRouteHeatmapZoom,
    });
  }

  if (requestedZoom < minRouteHeatmapZoom) {
    const factor = 2 ** (minRouteHeatmapZoom - requestedZoom);

    return normalizeActivityRouteHeatmapTileInput({
      tileX: requestedTileX * factor,
      tileY: requestedTileY * factor,
      zoom: minRouteHeatmapZoom,
    });
  }

  return normalizeActivityRouteHeatmapTileInput({
    tileX: requestedTileX,
    tileY: requestedTileY,
    zoom: requestedZoom,
  });
}

function normalizeActivityRouteHeatmapTileInput({
  tileX,
  tileY,
  zoom,
}: ActivityRouteHeatmapTileInput) {
  const tileCount = 2 ** zoom;

  if (!activityRouteHeatmapZoomLevels.includes(zoom as never)) {
    return null;
  }

  if (tileY < 0 || tileY >= tileCount) {
    return null;
  }

  return {
    tileX: ((tileX % tileCount) + tileCount) % tileCount,
    tileY,
    zoom,
  };
}

export async function renderActivityRouteHeatmapTile({
  displayMode = "density",
  tileX,
  tileY,
  userId,
  zoom,
}: RenderActivityRouteHeatmapTileInput) {
  assertTileInput({ tileX, tileY, zoom });

  const [cells, maxActivityCount] = await Promise.all([
    listActivityRouteHeatmapAggregateCellsForTile({
      tileX,
      tileY,
      userId,
      zoom,
    }),
    getActivityRouteHeatmapMaxActivityCount({
      userId,
      zoom,
    }),
  ]);

  return encodePng(
    renderTilePixels({
      cells,
      displayMode,
      maxActivityCount,
      tileX,
      tileY,
    }),
    tileSize,
    tileSize,
  );
}

export function renderEmptyActivityRouteHeatmapTile() {
  return encodePng(new Uint8Array(tileSize * tileSize * 4), tileSize, tileSize);
}

function assertTileInput({
  tileX,
  tileY,
  zoom,
}: {
  tileX: number;
  tileY: number;
  zoom: number;
}) {
  if (!activityRouteHeatmapZoomLevels.includes(zoom as never)) {
    throw new ActivityRouteHeatmapTileInputError(
      "Unsupported route heatmap zoom",
    );
  }

  const maxTile = 2 ** zoom - 1;

  if (
    !Number.isInteger(tileX) ||
    !Number.isInteger(tileY) ||
    tileX < 0 ||
    tileY < 0 ||
    tileX > maxTile ||
    tileY > maxTile
  ) {
    throw new ActivityRouteHeatmapTileInputError("Invalid route heatmap tile");
  }
}

function readTileInteger(
  value: string | undefined,
  { allowNegative = false }: { allowNegative?: boolean } = {},
) {
  if (!value) {
    return null;
  }

  const normalized = value.endsWith(".png") ? value.slice(0, -4) : value;
  const pattern = allowNegative ? /^-?\d+$/ : /^\d+$/;

  if (!pattern.test(normalized)) {
    return null;
  }

  return Number(normalized);
}

function renderTilePixels({
  cells,
  displayMode,
  maxActivityCount,
  tileX,
  tileY,
}: {
  cells: Array<{
    activityCount: number;
    cellX: number;
    cellY: number;
    tileX: number;
    tileY: number;
  }>;
  displayMode: ActivityRouteHeatmapDisplayMode;
  maxActivityCount: number;
  tileX: number;
  tileY: number;
}) {
  const accum = new Float32Array(tileSize * tileSize * 4);
  const cellPixelSize = tileSize / activityRouteHeatmapCellsPerTile;
  const radius = 18;

  for (const cell of cells) {
    const intensity = getIntensity({
      activityCount: cell.activityCount,
      displayMode,
      maxActivityCount,
    });

    if (intensity <= 0) {
      continue;
    }

    const color = getActivityRouteHeatmapColor(intensity);
    const centerX =
      ((cell.tileX - tileX) * activityRouteHeatmapCellsPerTile +
        cell.cellX +
        0.5) *
      cellPixelSize;
    const centerY =
      ((cell.tileY - tileY) * activityRouteHeatmapCellsPerTile +
        cell.cellY +
        0.5) *
      cellPixelSize;
    const minX = Math.max(0, Math.floor(centerX - radius));
    const maxX = Math.min(tileSize - 1, Math.ceil(centerX + radius));
    const minY = Math.max(0, Math.floor(centerY - radius));
    const maxY = Math.min(tileSize - 1, Math.ceil(centerY + radius));

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x + 0.5 - centerX;
        const dy = y + 0.5 - centerY;
        const distance = Math.hypot(dx, dy);

        if (distance > radius) {
          continue;
        }

        const falloff = (1 - distance / radius) ** 2;
        const alpha = (0.08 + intensity * 0.24) * falloff;
        const offset = (y * tileSize + x) * 4;

        accum[offset] = (accum[offset] ?? 0) + color.r * alpha;
        accum[offset + 1] = (accum[offset + 1] ?? 0) + color.g * alpha;
        accum[offset + 2] = (accum[offset + 2] ?? 0) + color.b * alpha;
        accum[offset + 3] = (accum[offset + 3] ?? 0) + alpha;
      }
    }
  }

  const pixels = new Uint8Array(tileSize * tileSize * 4);

  for (let index = 0; index < tileSize * tileSize; index += 1) {
    const offset = index * 4;
    const alpha = Math.min(1, accum[offset + 3] ?? 0);

    if (alpha <= 0) {
      continue;
    }

    pixels[offset] = Math.min(255, Math.round(accum[offset] ?? 0));
    pixels[offset + 1] = Math.min(255, Math.round(accum[offset + 1] ?? 0));
    pixels[offset + 2] = Math.min(255, Math.round(accum[offset + 2] ?? 0));
    pixels[offset + 3] = Math.round(alpha * 255);
  }

  return pixels;
}

function getIntensity({
  activityCount,
  displayMode,
  maxActivityCount,
}: {
  activityCount: number;
  displayMode: ActivityRouteHeatmapDisplayMode;
  maxActivityCount: number;
}) {
  if (displayMode === "visited") {
    return activityCount > 0 ? 1 : 0;
  }

  if (activityCount <= 0 || maxActivityCount <= 0) {
    return 0;
  }

  return Math.log1p(activityCount) / Math.log1p(maxActivityCount);
}

function encodePng(pixels: Uint8Array, width: number, height: number) {
  const rowLength = width * 4 + 1;
  const raw = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y += 1) {
    raw[y * rowLength] = 0;
    raw.set(
      pixels.subarray(y * width * 4, (y + 1) * width * 4),
      y * rowLength + 1,
    );
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    createPngChunk("IHDR", createIhdr(width, height)),
    createPngChunk("IDAT", deflateSync(raw)),
    createPngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function createIhdr(width: number, height: number) {
  const ihdr = Buffer.alloc(13);

  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return ihdr;
}

function createPngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);

  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(
    crc32(Buffer.concat([typeBuffer, data])),
    8 + data.length,
  );

  return chunk;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = (crcTable[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}
