import type {
  ActivityBestEffortInput,
  BestEffortStandardDistanceCode,
} from "../activities.types";

export type StandardBestEffortDistance = {
  code: BestEffortStandardDistanceCode;
  meters: number;
};

export const standardBestEffortDistances = [
  { code: "400m", meters: 400 },
  { code: "800m", meters: 800 },
  { code: "1000m", meters: 1000 },
  { code: "1mi", meters: 1609.344 },
  { code: "3000m", meters: 3000 },
  { code: "5k", meters: 5000 },
  { code: "10k", meters: 10_000 },
  { code: "half_marathon", meters: 21_097.5 },
  { code: "marathon", meters: 42_195 },
] as const satisfies StandardBestEffortDistance[];

type EffortWindow = {
  durationSeconds: number;
  endDistanceMeters: number;
  endElapsedTimeSeconds: number;
  startDistanceMeters: number;
  startElapsedTimeSeconds: number;
};

export function calculateActivityBestEfforts({
  distanceSamples,
  elapsedTimeSamples,
}: {
  distanceSamples: number[];
  elapsedTimeSamples: number[];
}): ActivityBestEffortInput[] {
  if (!streamsAreUsable({ distanceSamples, elapsedTimeSamples })) {
    return [];
  }

  const efforts: ActivityBestEffortInput[] = [];

  for (const standardDistance of standardBestEffortDistances) {
    const bestWindow = findBestWindowForDistance({
      distanceMeters: standardDistance.meters,
      distanceSamples,
      elapsedTimeSamples,
    });

    if (!bestWindow) {
      continue;
    }

    efforts.push({
      distanceMeters: standardDistance.meters,
      durationSeconds: bestWindow.durationSeconds,
      endDistanceMeters: bestWindow.endDistanceMeters,
      endElapsedTimeSeconds: bestWindow.endElapsedTimeSeconds,
      standardDistanceCode: standardDistance.code,
      startDistanceMeters: bestWindow.startDistanceMeters,
      startElapsedTimeSeconds: bestWindow.startElapsedTimeSeconds,
    });
  }

  return efforts;
}

function streamsAreUsable({
  distanceSamples,
  elapsedTimeSamples,
}: {
  distanceSamples: number[];
  elapsedTimeSamples: number[];
}) {
  if (
    distanceSamples.length === 0 ||
    distanceSamples.length !== elapsedTimeSamples.length
  ) {
    return false;
  }

  for (let index = 0; index < distanceSamples.length; index += 1) {
    const distance = distanceSamples[index];
    const elapsedTime = elapsedTimeSamples[index];

    if (
      distance === undefined ||
      elapsedTime === undefined ||
      !Number.isFinite(distance) ||
      !Number.isFinite(elapsedTime)
    ) {
      return false;
    }

    if (index === 0) {
      continue;
    }

    const previousDistance = distanceSamples[index - 1];
    const previousElapsedTime = elapsedTimeSamples[index - 1];

    if (
      previousDistance === undefined ||
      previousElapsedTime === undefined ||
      distance < previousDistance ||
      elapsedTime < previousElapsedTime
    ) {
      return false;
    }
  }

  return true;
}

function findBestWindowForDistance({
  distanceMeters,
  distanceSamples,
  elapsedTimeSamples,
}: {
  distanceMeters: number;
  distanceSamples: number[];
  elapsedTimeSamples: number[];
}): EffortWindow | null {
  const firstDistance = distanceSamples[0] ?? 0;
  const lastDistance = distanceSamples.at(-1) ?? 0;

  if (lastDistance - firstDistance < distanceMeters) {
    return null;
  }

  let bestWindow: EffortWindow | null = null;
  const candidateStartDistances = new Set<number>();

  for (const distance of distanceSamples) {
    if (distance + distanceMeters <= lastDistance) {
      candidateStartDistances.add(distance);
    }

    if (distance - distanceMeters >= firstDistance) {
      candidateStartDistances.add(distance - distanceMeters);
    }
  }

  for (const startDistanceMeters of candidateStartDistances) {
    const endDistanceMeters = startDistanceMeters + distanceMeters;
    const startElapsedTimeSeconds = interpolateElapsedTimeAtDistance({
      distanceMeters: startDistanceMeters,
      distanceSamples,
      elapsedTimeSamples,
    });
    const endElapsedTimeSeconds = interpolateElapsedTimeAtDistance({
      distanceMeters: endDistanceMeters,
      distanceSamples,
      elapsedTimeSamples,
    });

    if (
      startElapsedTimeSeconds === null ||
      endElapsedTimeSeconds === null ||
      endElapsedTimeSeconds < startElapsedTimeSeconds
    ) {
      continue;
    }

    const roundedStartElapsedTimeSeconds = Math.round(startElapsedTimeSeconds);
    const roundedEndElapsedTimeSeconds = Math.round(endElapsedTimeSeconds);
    const candidate = {
      durationSeconds:
        roundedEndElapsedTimeSeconds - roundedStartElapsedTimeSeconds,
      endDistanceMeters,
      endElapsedTimeSeconds: roundedEndElapsedTimeSeconds,
      startDistanceMeters,
      startElapsedTimeSeconds: roundedStartElapsedTimeSeconds,
    };

    if (isBetterWindow(candidate, bestWindow)) {
      bestWindow = candidate;
    }
  }

  return bestWindow;
}

function interpolateElapsedTimeAtDistance({
  distanceMeters,
  distanceSamples,
  elapsedTimeSamples,
}: {
  distanceMeters: number;
  distanceSamples: number[];
  elapsedTimeSamples: number[];
}) {
  for (let index = 0; index < distanceSamples.length; index += 1) {
    const distance = distanceSamples[index];
    const elapsedTime = elapsedTimeSamples[index];

    if (distance === distanceMeters && elapsedTime !== undefined) {
      return elapsedTime;
    }

    if (index === 0) {
      continue;
    }

    const previousDistance = distanceSamples[index - 1];
    const previousElapsedTime = elapsedTimeSamples[index - 1];

    if (
      distance === undefined ||
      elapsedTime === undefined ||
      previousDistance === undefined ||
      previousElapsedTime === undefined ||
      distanceMeters < previousDistance ||
      distanceMeters > distance
    ) {
      continue;
    }

    if (distance === previousDistance) {
      return elapsedTime;
    }

    const distanceRatio =
      (distanceMeters - previousDistance) / (distance - previousDistance);

    return (
      previousElapsedTime + distanceRatio * (elapsedTime - previousElapsedTime)
    );
  }

  return null;
}

function isBetterWindow(candidate: EffortWindow, current: EffortWindow | null) {
  if (!current) {
    return true;
  }

  if (candidate.durationSeconds !== current.durationSeconds) {
    return candidate.durationSeconds < current.durationSeconds;
  }

  return candidate.startElapsedTimeSeconds < current.startElapsedTimeSeconds;
}
