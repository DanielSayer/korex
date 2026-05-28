import type {
  ActivityStreamChartPoint,
  ActivityStreamInput,
  ActivityStreamsChartData,
  ActivityStreamType,
} from "../activities.types";
import { getActivityStreamsRecord } from "./activity-streams.repository";

const maxActivityStreamChartPoints = 1200;

const chartStreamTypes = [
  "altitude",
  "cadence",
  "distance",
  "heartRate",
  "velocity",
] as const satisfies ActivityStreamType[];

type ChartStreamType = (typeof chartStreamTypes)[number];

export async function getActivityStreams({
  activityId,
  userId,
}: {
  activityId: number;
  userId: string;
}): Promise<ActivityStreamsChartData | null> {
  const record = await getActivityStreamsRecord({ activityId, userId });

  if (!record) {
    return null;
  }

  const streamByType = new Map(
    record.streams.map((stream) => [stream.streamType, stream]),
  );
  const elapsedTimeStream = streamByType.get("elapsedTime") ?? null;
  const activityDurationSeconds = getActivityDurationSeconds(record);
  const distancePoints = toBaseChartPoints({
    activityDurationSeconds,
    elapsedTimeStream,
    stream: streamByType.get("distance") ?? null,
    streamType: "distance",
  });

  return {
    altitude: toChartPoints({
      activityDurationSeconds,
      distancePoints,
      elapsedTimeStream,
      stream: streamByType.get("altitude") ?? null,
      streamType: "altitude",
    }),
    cadence: toChartPoints({
      activityDurationSeconds,
      distancePoints,
      elapsedTimeStream,
      stream: streamByType.get("cadence") ?? null,
      streamType: "cadence",
    }),
    distance: toChartPoints({
      activityDurationSeconds,
      distancePoints,
      elapsedTimeStream,
      stream: streamByType.get("distance") ?? null,
      streamType: "distance",
    }),
    heartRate: toChartPoints({
      activityDurationSeconds,
      distancePoints,
      elapsedTimeStream,
      stream: streamByType.get("heartRate") ?? null,
      streamType: "heartRate",
    }),
    velocity: toChartPoints({
      activityDurationSeconds,
      distancePoints,
      elapsedTimeStream,
      stream: streamByType.get("velocity") ?? null,
      streamType: "velocity",
    }),
  };
}

function getActivityDurationSeconds(input: {
  elapsedTimeSeconds: number | null;
  movingTimeSeconds: number | null;
}) {
  return input.elapsedTimeSeconds ?? input.movingTimeSeconds;
}

function toChartPoints({
  activityDurationSeconds,
  distancePoints,
  elapsedTimeStream,
  stream,
  streamType,
}: {
  activityDurationSeconds: number | null;
  distancePoints: ActivityStreamChartPoint[];
  elapsedTimeStream: ActivityStreamInput | null;
  stream: ActivityStreamInput | null;
  streamType: ChartStreamType;
}): ActivityStreamChartPoint[] {
  const points = toBaseChartPoints({
    activityDurationSeconds,
    elapsedTimeStream,
    stream,
    streamType,
  }).map((point) => ({
    ...point,
    distanceMeters:
      streamType === "distance"
        ? point.value
        : getDistanceAtSecond(distancePoints, point.second),
  }));

  return downsampleChartPoints(points, maxActivityStreamChartPoints);
}

function toBaseChartPoints({
  activityDurationSeconds,
  elapsedTimeStream,
  stream,
  streamType,
}: {
  activityDurationSeconds: number | null;
  elapsedTimeStream: ActivityStreamInput | null;
  stream: ActivityStreamInput | null;
  streamType: ChartStreamType;
}): ActivityStreamChartPoint[] {
  if (!stream) {
    return [];
  }

  const points = stream.data.flatMap((value, index) => {
    if (!isValidStreamValue(streamType, value)) {
      return [];
    }

    return [
      {
        distanceMeters: null,
        second: getSampleSecond({
          activityDurationSeconds,
          elapsedTimeStream,
          index,
          pointCount: stream.data.length,
        }),
        value,
      },
    ];
  });

  return points;
}

function isValidStreamValue(streamType: ChartStreamType, value: number) {
  if (!Number.isFinite(value)) {
    return false;
  }

  if (streamType === "heartRate" || streamType === "velocity") {
    return value > 0;
  }

  if (streamType === "cadence" || streamType === "distance") {
    return value >= 0;
  }

  return true;
}

function getSampleSecond({
  activityDurationSeconds,
  elapsedTimeStream,
  index,
  pointCount,
}: {
  activityDurationSeconds: number | null;
  elapsedTimeStream: ActivityStreamInput | null;
  index: number;
  pointCount: number;
}) {
  const elapsedSecond = elapsedTimeStream?.data[index];

  if (typeof elapsedSecond === "number" && Number.isFinite(elapsedSecond)) {
    return elapsedSecond;
  }

  if (
    typeof activityDurationSeconds === "number" &&
    Number.isFinite(activityDurationSeconds) &&
    activityDurationSeconds > 0 &&
    pointCount > 0
  ) {
    return pointCount === 1
      ? 0
      : index * (activityDurationSeconds / (pointCount - 1));
  }

  return index;
}

function downsampleChartPoints(
  points: ActivityStreamChartPoint[],
  maxPoints: number,
) {
  if (points.length <= maxPoints) {
    return points;
  }

  if (maxPoints <= 2) {
    return [points[0], points[points.length - 1]].filter(
      (point): point is ActivityStreamChartPoint => point !== undefined,
    );
  }

  const selectedIndices = new Set<number>([0, points.length - 1]);
  const internalPointCount = points.length - 2;
  const internalBudget = maxPoints - 2;
  const extremeBucketCount = Math.min(
    Math.max(0, Math.floor(internalBudget / 2)),
    internalPointCount,
  );

  if (extremeBucketCount > 0) {
    const bucketSize = internalPointCount / extremeBucketCount;

    for (
      let bucketIndex = 0;
      bucketIndex < extremeBucketCount;
      bucketIndex += 1
    ) {
      const start = 1 + Math.floor(bucketIndex * bucketSize);
      const end =
        bucketIndex === extremeBucketCount - 1
          ? points.length - 1
          : 1 + Math.floor((bucketIndex + 1) * bucketSize);

      if (start >= end) {
        continue;
      }

      let minIndex = start;
      let maxIndex = start;

      for (let pointIndex = start + 1; pointIndex < end; pointIndex += 1) {
        const point = points[pointIndex];
        const minPoint = points[minIndex];
        const maxPoint = points[maxIndex];

        if (!point || !minPoint || !maxPoint) {
          continue;
        }

        if (point.value < minPoint.value) {
          minIndex = pointIndex;
        }

        if (point.value > maxPoint.value) {
          maxIndex = pointIndex;
        }
      }

      selectedIndices.add(minIndex);
      selectedIndices.add(maxIndex);
    }
  }

  const remainingBudget = maxPoints - selectedIndices.size;

  if (remainingBudget > 0) {
    const availableIndices = points
      .map((_, index) => index)
      .filter((index) => !selectedIndices.has(index));
    const fillStep = availableIndices.length / remainingBudget;

    for (
      let fillIndex = 0;
      fillIndex < remainingBudget && availableIndices.length > 0;
      fillIndex += 1
    ) {
      const candidateIndex =
        availableIndices[
          Math.min(
            availableIndices.length - 1,
            Math.floor(fillIndex * fillStep),
          )
        ];

      if (candidateIndex !== undefined) {
        selectedIndices.add(candidateIndex);
      }
    }
  }

  return [...selectedIndices]
    .sort((left, right) => left - right)
    .slice(0, maxPoints)
    .flatMap((index) => {
      const point = points[index];
      return point ? [point] : [];
    });
}

function getDistanceAtSecond(
  distancePoints: ActivityStreamChartPoint[],
  second: number,
) {
  if (distancePoints.length === 0) {
    return null;
  }

  const first = distancePoints[0];
  const last = distancePoints.at(-1);

  if (!first || !last) {
    return null;
  }

  if (second <= first.second) {
    return first.value;
  }

  if (second >= last.second) {
    return last.value;
  }

  let low = 0;
  let high = distancePoints.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const current = distancePoints[mid];

    if (!current) {
      return null;
    }

    if (current.second === second) {
      return current.value;
    }

    if (current.second < second) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const before = distancePoints[high];
  const after = distancePoints[low];

  if (!before || !after) {
    return null;
  }

  const span = after.second - before.second;

  if (span <= 0) {
    return before.value;
  }

  const ratio = (second - before.second) / span;
  return before.value + (after.value - before.value) * ratio;
}
