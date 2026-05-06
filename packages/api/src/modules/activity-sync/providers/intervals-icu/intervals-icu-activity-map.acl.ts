import type { IntervalsIcuActivityMap } from "@korex/integrations/intervals-icu/client";
import type {
  ActivityMapBoundsInput,
  ActivityMapCoordinateInput,
  ActivityMapInput,
} from "../../../activities/activities.types";
import { ActivitySyncError } from "../../activity-sync.errors";
import { isRecord } from "../../anti-corruption/readers";

export function toActivityMapFromIntervalsIcuMap(
  map: IntervalsIcuActivityMap,
): ActivityMapInput {
  if (!isRecord(map)) {
    throw invalidMapError();
  }

  const latlngs = map.latlngs;

  if (!Array.isArray(latlngs) || latlngs.length === 0) {
    throw invalidMapError();
  }

  return {
    bounds: readBounds(map.bounds),
    coordinates: latlngs.map(readCoordinate),
  };
}

function readBounds(value: unknown): ActivityMapBoundsInput | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Array.isArray(value) || value.length !== 2) {
    throw invalidMapError();
  }

  return {
    northEast: readCoordinate(value[1]),
    southWest: readCoordinate(value[0]),
  };
}

function readCoordinate(value: unknown): ActivityMapCoordinateInput {
  if (!Array.isArray(value) || value.length !== 2) {
    throw invalidMapError();
  }

  const [latitude, longitude] = value;

  if (!isLatitude(latitude) || !isLongitude(longitude)) {
    throw invalidMapError();
  }

  return { latitude, longitude };
}

function isLatitude(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  );
}

function isLongitude(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
}

function invalidMapError() {
  return new ActivitySyncError({
    message: "Intervals.icu activity map is missing or invalid",
  });
}
