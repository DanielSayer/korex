import type {
  BestEffortStandardDistanceCode,
  PersonalBestEffort,
  PersonalBestEffortTrendBucket,
} from "../activities.types";
import {
  getBrisbaneCalendarDateStartAt,
  toUtcDate,
} from "./analytics-calendar";

export const standardDistanceCodes: BestEffortStandardDistanceCode[] = [
  "400m",
  "800m",
  "1000m",
  "1mi",
  "3000m",
  "5k",
  "10k",
  "half_marathon",
  "marathon",
];

export type ActivityBestEffortRow = {
  activityId: number;
  activityStartAt: Date | string;
  distanceMeters: number;
  durationSeconds: number;
  standardDistanceCode: BestEffortStandardDistanceCode;
};

export type MonthBucket = {
  bucketEndAt: Date;
  bucketStartAt: Date;
};

export function buildMonthlyBestEffortTrendBuckets({
  buckets,
  rows,
}: {
  buckets: MonthBucket[];
  rows: ActivityBestEffortRow[];
}): PersonalBestEffortTrendBucket[] {
  const bestByDistance = new Map<BestEffortStandardDistanceCode, number>();
  let rowIndex = 0;
  const trendBuckets: PersonalBestEffortTrendBucket[] = [];

  for (const bucket of buckets) {
    while (rowIndex < rows.length) {
      const row = rows[rowIndex];

      if (!row || toUtcDate(row.activityStartAt) >= bucket.bucketEndAt) {
        break;
      }

      const currentBest = bestByDistance.get(row.standardDistanceCode);

      if (currentBest === undefined || row.durationSeconds < currentBest) {
        bestByDistance.set(row.standardDistanceCode, row.durationSeconds);
      }

      rowIndex += 1;
    }

    for (const standardDistanceCode of standardDistanceCodes) {
      trendBuckets.push({
        bucketEndAt: bucket.bucketEndAt,
        bucketStartAt: bucket.bucketStartAt,
        durationSeconds: bestByDistance.get(standardDistanceCode) ?? null,
        standardDistanceCode,
      });
    }
  }

  return trendBuckets;
}

export function createMonthlyBestEffortBuckets(year: number): MonthBucket[] {
  return Array.from({ length: 12 }, (_, month) => {
    const bucketStartAt = getBrisbaneCalendarDateStartAt(year, month, 1);
    const bucketEndAt = getBrisbaneCalendarDateStartAt(year, month + 1, 1);

    return { bucketEndAt, bucketStartAt };
  });
}

export function sortByStandardDistance<
  T extends { standardDistanceCode: string },
>(efforts: T[]) {
  return [...efforts].sort(
    (first, second) =>
      standardDistanceCodes.indexOf(
        first.standardDistanceCode as BestEffortStandardDistanceCode,
      ) -
      standardDistanceCodes.indexOf(
        second.standardDistanceCode as BestEffortStandardDistanceCode,
      ),
  );
}

export function toPersonalBestEffort(
  row: ActivityBestEffortRow,
): PersonalBestEffort {
  return {
    ...row,
    activityStartAt: toUtcDate(row.activityStartAt),
  };
}
