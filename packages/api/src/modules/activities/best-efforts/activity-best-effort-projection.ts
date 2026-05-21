import type {
  ActivityBestEffortInput,
  BestEffortStandardDistanceCode,
} from "../activities.types";

export type PersonalBestEffortCandidate = {
  activityBestEffortId: number;
  activityId: number;
  activityStartAt: Date;
  distanceMeters: number;
  durationSeconds: number;
  endElapsedTimeSeconds: number;
  sportType: "run" | "treadmill" | "hike";
  standardDistanceCode: BestEffortStandardDistanceCode;
  startElapsedTimeSeconds: number;
};

export function collectAffectedBestEffortDistanceCodes({
  efforts,
  existingDistanceCodes,
}: {
  efforts: ActivityBestEffortInput[];
  existingDistanceCodes: BestEffortStandardDistanceCode[];
}) {
  return [
    ...new Set([
      ...existingDistanceCodes,
      ...efforts.map((effort) => effort.standardDistanceCode),
    ]),
  ];
}

export function selectPersonalBestEffortCandidate(
  candidates: PersonalBestEffortCandidate[],
) {
  return [...candidates].sort(comparePersonalBestEffortCandidates)[0] ?? null;
}

function comparePersonalBestEffortCandidates(
  first: PersonalBestEffortCandidate,
  second: PersonalBestEffortCandidate,
) {
  return (
    first.durationSeconds - second.durationSeconds ||
    first.activityStartAt.getTime() - second.activityStartAt.getTime() ||
    first.activityBestEffortId - second.activityBestEffortId
  );
}
