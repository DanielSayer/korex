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
  return Object.entries(streams).flatMap(([streamKey, rawStream]) => {
    const stream = readIntervalsIcuStream(streamKey, rawStream);

    if (!stream) {
      return [];
    }

    return [stream];
  });
}

function readIntervalsIcuStream(
  streamKey: string,
  rawStream: unknown,
): ActivityStreamInput | null {
  if (!isRecord(rawStream)) {
    throw invalidStreamError();
  }

  const streamType = readStreamType(rawStream.type ?? streamKey);

  if (!streamType) {
    return null;
  }

  if (!Array.isArray(rawStream.data)) {
    throw invalidStreamError();
  }

  return {
    data: rawStream.data.map((value) => readStreamValue(value, streamType)),
    streamType,
  };
}

function readStreamType(value: unknown): ActivityStreamType | null {
  if (typeof value !== "string") {
    throw invalidStreamError();
  }

  return intervalsIcuStreamTypes[value] ?? null;
}

function readStreamValue(value: unknown, streamType: ActivityStreamType) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidStreamError();
  }

  if (streamType === "cadence") {
    const cadence = readIntervalsIcuCadenceStepsPerMinute(value);

    if (cadence === null) {
      throw invalidStreamError();
    }

    return cadence;
  }

  return value;
}

function invalidStreamError() {
  return new ActivitySyncError({
    message: "Intervals.icu activity streams are missing or invalid",
  });
}
