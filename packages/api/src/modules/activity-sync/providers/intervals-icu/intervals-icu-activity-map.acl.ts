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
): ActivityMapInput | null {
  if (!isRecord(map)) {
    throw invalidMapError();
  }

  const latlngs = map.latlngs;

  if (latlngs === null || latlngs === undefined) {
    return null;
  }

  if (!Array.isArray(latlngs)) {
    throw invalidMapError({
      field: "latlngs",
      shape: describeValue(latlngs),
    });
  }

  if (latlngs.length === 0) {
    return null;
  }

  const coordinates = latlngs.flatMap((value) =>
    value === null ? [] : [readCoordinate(value)],
  );

  if (coordinates.length === 0) {
    return null;
  }

  return {
    bounds: readBounds(map.bounds),
    coordinates,
  };
}

function readBounds(value: unknown): ActivityMapBoundsInput | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Array.isArray(value) || value.length !== 2) {
    throw invalidMapError({
      field: "bounds",
      shape: describeValue(value),
    });
  }

  return {
    northEast: readCoordinate(value[1]),
    southWest: readCoordinate(value[0]),
  };
}

function readCoordinate(value: unknown): ActivityMapCoordinateInput {
  if (isRecord(value)) {
    const latitude = value.lat ?? value.latitude;
    const longitude = value.lng ?? value.lon ?? value.longitude;

    if (!isLatitude(latitude) || !isLongitude(longitude)) {
      throw invalidMapError({
        field: "coordinate",
        shape: describeValue(value),
      });
    }

    return { latitude, longitude };
  }

  if (!Array.isArray(value) || value.length !== 2) {
    throw invalidMapError({
      field: "coordinate",
      shape: describeValue(value),
    });
  }

  const [latitude, longitude] = value;

  if (!isLatitude(latitude) || !isLongitude(longitude)) {
    throw invalidMapError({
      field: "coordinate",
      shape: describeValue(value),
    });
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

function invalidMapError(details?: unknown) {
  return new ActivitySyncError({
    details,
    message: "Intervals.icu activity map is missing or invalid",
  });
}

function describeValue(value: unknown) {
  if (Array.isArray(value)) {
    return {
      length: value.length,
      sample: value.slice(0, 3),
      type: "array",
    };
  }

  if (isRecord(value)) {
    const keys = Object.keys(value);

    return {
      keys: keys.slice(0, 20),
      keyCount: keys.length,
      type: "object",
    };
  }

  return {
    type: value === null ? "null" : typeof value,
    value,
  };
}
