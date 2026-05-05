import type { IntervalsIcuActivityDetail } from "@korex/integrations/intervals-icu/client";
import type {
  ActivityInput,
  SportType,
} from "../../../activities/activities.types";
import {
  readNonNegativeInteger,
  readNonNegativeNumber,
  readOptionalString,
  readPositiveInteger,
  readPositiveNumber,
  readRequiredDate,
} from "../../anti-corruption/readers";

type ActivityAclResult =
  | {
      activity: ActivityInput;
      type: "activity";
    }
  | {
      providerSportType: string | null;
      type: "unsupported_sport_type";
    };

const defaultActivityNames: Record<SportType, string> = {
  hike: "Hike",
  run: "Run",
  treadmill: "Treadmill Run",
};

export function toActivityFromIntervalsIcuDetail({
  detail,
  userId,
}: {
  detail: IntervalsIcuActivityDetail;
  userId: string;
}): ActivityAclResult {
  const providerSportType = readProviderSportType(detail);
  const sportType = toSportType(providerSportType);

  if (!sportType) {
    return {
      providerSportType,
      type: "unsupported_sport_type",
    };
  }

  return {
    activity: {
      averageCadenceStepsPerMinute: readPositiveInteger(detail.average_cadence),
      averageHeartRateBeatsPerMinute: readPositiveInteger(
        detail.average_heartrate,
      ),
      averageSpeedMetersPerSecond: readPositiveNumber(detail.average_speed),
      deviceName: readOptionalString(detail.device_name),
      distanceMeters: readNonNegativeNumber(detail.distance),
      elapsedTimeSeconds: readNonNegativeInteger(detail.elapsed_time),
      energyKilocalories: readNonNegativeInteger(detail.calories),
      maxHeartRateBeatsPerMinute: readPositiveInteger(detail.max_heartrate),
      maxSpeedMetersPerSecond: readPositiveNumber(detail.max_speed),
      movingTimeSeconds: readNonNegativeInteger(detail.moving_time),
      name: readOptionalString(detail.name) ?? defaultActivityNames[sportType],
      sportType,
      startAt: readRequiredDate(
        detail.start_date ?? detail.start_time ?? detail.start_date_local,
        "Intervals.icu activity start date",
      ),
      totalElevationGainMeters: readNonNegativeNumber(
        detail.total_elevation_gain,
      ),
      totalElevationLossMeters: readNonNegativeNumber(
        detail.total_elevation_loss,
      ),
      userId,
    },
    type: "activity",
  };
}

function readProviderSportType(detail: IntervalsIcuActivityDetail) {
  return readOptionalString(detail.type ?? detail.sport ?? detail.category);
}

function toSportType(value: string | null): SportType | null {
  const normalized = value?.toLowerCase().replaceAll(/[\s_-]/g, "");

  switch (normalized) {
    case "run":
    case "trailrun":
      return "run";
    case "treadmill":
    case "treadmillrun":
      return "treadmill";
    case "hike":
    case "hiking":
      return "hike";
    default:
      return null;
  }
}
