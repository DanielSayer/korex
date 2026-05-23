import type {
  ActivityDetailSummary,
  ActivityMapInput,
} from "../activities.types";
import { getActivityDetailSummaryRecord } from "./activity-detail-summary.repository";

const maxActivityDetailMapCoordinates = 2000;

export async function getActivityDetailSummary({
  activityId,
  userId,
}: {
  activityId: number;
  userId: string;
}): Promise<ActivityDetailSummary | null> {
  const summary = await getActivityDetailSummaryRecord({ activityId, userId });

  if (!summary) {
    return null;
  }

  return {
    ...summary,
    map: toActivityDetailMapPreview(summary.map),
  };
}

function toActivityDetailMapPreview(
  map: ActivityMapInput | null,
): ActivityMapInput | null {
  if (!map) {
    return null;
  }

  return {
    bounds: map.bounds,
    coordinates: downsampleCoordinates(map.coordinates),
  };
}

function downsampleCoordinates(
  coordinates: ActivityMapInput["coordinates"],
): ActivityMapInput["coordinates"] {
  if (coordinates.length <= maxActivityDetailMapCoordinates) {
    return coordinates;
  }

  const stride = Math.ceil(
    coordinates.length / maxActivityDetailMapCoordinates,
  );
  return coordinates.filter((_, index) => index % stride === 0);
}
