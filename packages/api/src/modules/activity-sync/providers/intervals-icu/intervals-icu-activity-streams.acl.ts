import type { IntervalsIcuActivityStreams } from "@korex/integrations/intervals-icu/client";
import type {
  ActivityStreamInput,
  ActivityStreamType,
} from "../../../activities/activities.types";
import { ActivitySyncError } from "../../activity-sync.errors";
import { isRecord } from "../../anti-corruption/readers";
import { readIntervalsIcuCadenceStepsPerMinute } from "./intervals-icu-readers";

const intervalsIcuStreamTypeMap = {
  cadence: "cadence",
  distance: "distance",
  fixed_altitude: "altitude",
  heartrate: "heartRate",
  velocity_smooth: "velocity",
} satisfies Record<string, ActivityStreamType>;
const intervalsIcuStreamTypes: Record<string, ActivityStreamType> =
  intervalsIcuStreamTypeMap;

export function toActivityStreamsFromIntervalsIcuStreams(
  streams: IntervalsIcuActivityStreams,
): ActivityStreamInput[] {
  return readRawStreams(streams).flatMap(([streamKey, rawStream]) => {
    const stream = readIntervalsIcuStream(streamKey, rawStream);

    if (!stream) {
      return [];
    }

    return [stream];
  });
}

function readRawStreams(
  streams: IntervalsIcuActivityStreams,
): [string, unknown][] {
  if (Array.isArray(streams)) {
    return streams.map((stream, index) => [String(index), stream]);
  }

  return Object.entries(streams);
}

function readIntervalsIcuStream(
  streamKey: string,
  rawStream: unknown,
): ActivityStreamInput | null {
  if (!isRecord(rawStream)) {
    throw invalidStreamError({
      field: "stream",
      streamKey,
      shape: describeValue(rawStream),
    });
  }

  const streamType = readStreamType(rawStream.type ?? streamKey);

  if (!streamType) {
    return null;
  }

  const rawData = readRawStreamData(rawStream);

  if (!rawData) {
    if (rawStream.allNull === true) {
      return null;
    }

    throw invalidStreamError({
      field: "data",
      streamKey,
      streamType: rawStream.type,
      shape: describeValue(rawStream.data),
      fallbackShape: describeValue(rawStream.data2),
    });
  }

  const data = rawData.flatMap((value) => readStreamValue(value, streamType));

  return data.length > 0 ? { data, streamType } : null;
}

function readRawStreamData(rawStream: Record<string, unknown>) {
  if (Array.isArray(rawStream.data)) {
    return rawStream.data;
  }

  if (Array.isArray(rawStream.data2)) {
    return rawStream.data2;
  }

  return null;
}

function readStreamType(value: unknown): ActivityStreamType | null {
  if (typeof value !== "string") {
    throw invalidStreamError({
      field: "type",
      shape: describeValue(value),
    });
  }

  return intervalsIcuStreamTypes[value] ?? null;
}

function readStreamValue(value: unknown, streamType: ActivityStreamType) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return [];
  }

  if (streamType === "cadence") {
    const cadence = readIntervalsIcuCadenceStepsPerMinute(value);

    if (cadence === null) {
      return [];
    }

    return [cadence];
  }

  return [value];
}

function invalidStreamError(details?: unknown) {
  return new ActivitySyncError({
    details,
    message: "Intervals.icu activity streams are missing or invalid",
  });
}

function describeValue(value: unknown) {
  if (Array.isArray(value)) {
    return {
      length: value.length,
      sampleTypes: value
        .slice(0, 10)
        .map((item) => (item === null ? "null" : typeof item)),
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
