import type {
  ActivityHeartRateZoneSnapshotInput,
  ActivityHeartRateZoneTimeInput,
} from "./activities.types";

export type CalculateActivityHeartRateZoneTimesInput = {
  heartRateSamples: number[];
  movingTimeSeconds: number | null;
  snapshots: ActivityHeartRateZoneSnapshotInput[];
};

export function calculateActivityHeartRateZoneTimes({
  heartRateSamples,
  movingTimeSeconds,
  snapshots,
}: CalculateActivityHeartRateZoneTimesInput): ActivityHeartRateZoneTimeInput[] {
  if (
    movingTimeSeconds === null ||
    movingTimeSeconds <= 0 ||
    heartRateSamples.length === 0 ||
    snapshots.length === 0
  ) {
    return [];
  }

  const sampleDurationSeconds = movingTimeSeconds / heartRateSamples.length;
  const zoneTimeSecondsByPosition = new Map<number, number>();

  for (const heartRateSample of heartRateSamples) {
    const snapshot = snapshots.find((zone) =>
      isHeartRateSampleInSnapshot(heartRateSample, zone),
    );

    if (!snapshot) {
      continue;
    }

    zoneTimeSecondsByPosition.set(
      snapshot.position,
      (zoneTimeSecondsByPosition.get(snapshot.position) ?? 0) +
        sampleDurationSeconds,
    );
  }

  return snapshots.flatMap((snapshot) => {
    const timeSeconds = zoneTimeSecondsByPosition.get(snapshot.position);

    if (timeSeconds === undefined) {
      return [];
    }

    return [
      {
        position: snapshot.position,
        timeSeconds: Math.round(timeSeconds),
      },
    ];
  });
}

function isHeartRateSampleInSnapshot(
  heartRateSample: number,
  snapshot: ActivityHeartRateZoneSnapshotInput,
) {
  return (
    heartRateSample >= snapshot.minBpm &&
    (snapshot.maxBpm === null || heartRateSample < snapshot.maxBpm)
  );
}
