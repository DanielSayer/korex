import type { IntervalsIcuActivityDetail } from "@korex/integrations/intervals-icu/client";
import type { ActivityLapInput } from "../../../activities/activities.types";
import { ActivitySyncError } from "../../activity-sync.errors";
import {
  isRecord,
  readNonNegativeInteger,
  readNonNegativeNumber,
  readPositiveInteger,
  readPositiveNumber,
} from "../../anti-corruption/readers";
import { readIntervalsIcuCadenceStepsPerMinute } from "./intervals-icu-readers";

export function toActivityLapsFromIntervalsIcuDetail(
  detail: IntervalsIcuActivityDetail,
): ActivityLapInput[] {
  const intervals = detail.icu_intervals;

  if (!intervals) {
    return [];
  }

  if (!Array.isArray(intervals)) {
    throw new ActivitySyncError({
      message: "Intervals.icu activity laps are missing or invalid",
    });
  }

  return intervals.map((interval, index) => {
    const lap = toActivityLap(interval, index);

    if (index === 0 && lap.startTimeSeconds !== 0) {
      throw new ActivitySyncError({
        message: "Intervals.icu activity laps must start at 0",
      });
    }

    const previous = index > 0 ? intervals[index - 1] : null;
    const previousEnd =
      previous && isRecord(previous)
        ? readNonNegativeInteger(previous.end_time)
        : null;

    if (index > 0 && lap.startTimeSeconds !== previousEnd) {
      throw new ActivitySyncError({
        message: "Intervals.icu activity laps must be contiguous",
      });
    }

    return lap;
  });
}

function toActivityLap(value: unknown, index: number): ActivityLapInput {
  if (!isRecord(value)) {
    throw new ActivitySyncError({
      message: "Intervals.icu activity lap is missing or invalid",
    });
  }

  const distanceMeters = readNonNegativeNumber(value.distance);
  const startTimeSeconds = readNonNegativeInteger(value.start_time);
  const endTimeSeconds = readNonNegativeInteger(value.end_time);

  if (distanceMeters === null) {
    throw new ActivitySyncError({
      message: "Intervals.icu activity lap distance is missing or invalid",
    });
  }

  if (startTimeSeconds === null) {
    throw new ActivitySyncError({
      message: "Intervals.icu activity lap start time is missing or invalid",
    });
  }

  if (endTimeSeconds === null || endTimeSeconds <= startTimeSeconds) {
    throw new ActivitySyncError({
      message: "Intervals.icu activity lap end time is missing or invalid",
    });
  }

  return {
    averageCadenceStepsPerMinute: readIntervalsIcuCadenceStepsPerMinute(
      value.average_cadence,
    ),
    averageHeartRateBeatsPerMinute: readPositiveInteger(
      value.average_heartrate,
    ),
    averageSpeedMetersPerSecond: readPositiveNumber(value.average_speed),
    averageStrideLengthMeters: readPositiveNumber(value.average_stride),
    distanceMeters,
    elapsedTimeSeconds: readNonNegativeInteger(value.elapsed_time),
    endTimeSeconds,
    index,
    maxHeartRateBeatsPerMinute: readPositiveInteger(value.max_heartrate),
    maxSpeedMetersPerSecond: readPositiveNumber(value.max_speed),
    movingTimeSeconds: readNonNegativeInteger(value.moving_time),
    startTimeSeconds,
    totalElevationGainMeters: readNonNegativeNumber(value.total_elevation_gain),
  };
}
