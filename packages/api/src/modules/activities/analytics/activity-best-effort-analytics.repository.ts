import { activityBestEfforts, db, personalBestEfforts } from "@korex/db";
import { and, asc, eq, lt } from "drizzle-orm";

import type {
  AnalyticsBestEfforts,
  BestEffortStandardDistanceCode,
  PersonalBestEffort,
  PersonalBestEffortTrendBucket,
} from "../activities.types";

const brisbaneUtcOffsetHours = 10;
const millisecondsPerHour = 60 * 60 * 1000;

const standardDistanceCodes: BestEffortStandardDistanceCode[] = [
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

type ActivityBestEffortRow = {
  activityId: number;
  activityStartAt: Date | string;
  distanceMeters: number;
  durationSeconds: number;
  standardDistanceCode: BestEffortStandardDistanceCode;
};

export async function getAnalyticsBestEfforts({
  userId,
  year,
}: {
  userId: string;
  year: number;
}): Promise<AnalyticsBestEfforts> {
  const monthlyBuckets = createMonthlyBuckets(year);
  const lastBucket = monthlyBuckets.at(-1);

  if (!lastBucket) {
    return {
      allTime: [],
      monthlyTrendBuckets: [],
      year,
    };
  }

  const [allTimeRows, historicalRows] = await Promise.all([
    listPersonalBestEfforts({ userId }),
    listActivityBestEffortsThrough({
      endAt: lastBucket.bucketEndAt,
      userId,
    }),
  ]);

  return {
    allTime: sortByStandardDistance(allTimeRows.map(toPersonalBestEffort)),
    monthlyTrendBuckets: buildMonthlyTrendBuckets({
      buckets: monthlyBuckets,
      rows: historicalRows,
    }),
    year,
  };
}

async function listPersonalBestEfforts({ userId }: { userId: string }) {
  return db
    .select({
      activityId: personalBestEfforts.activityId,
      activityStartAt: personalBestEfforts.activityStartAt,
      distanceMeters: personalBestEfforts.distanceMeters,
      durationSeconds: personalBestEfforts.durationSeconds,
      standardDistanceCode: personalBestEfforts.standardDistanceCode,
    })
    .from(personalBestEfforts)
    .where(eq(personalBestEfforts.userId, userId));
}

async function listActivityBestEffortsThrough({
  endAt,
  userId,
}: {
  endAt: Date;
  userId: string;
}) {
  return db
    .select({
      activityId: activityBestEfforts.activityId,
      activityStartAt: activityBestEfforts.activityStartAt,
      distanceMeters: activityBestEfforts.distanceMeters,
      durationSeconds: activityBestEfforts.durationSeconds,
      standardDistanceCode: activityBestEfforts.standardDistanceCode,
    })
    .from(activityBestEfforts)
    .where(
      and(
        eq(activityBestEfforts.userId, userId),
        lt(activityBestEfforts.activityStartAt, endAt),
      ),
    )
    .orderBy(
      asc(activityBestEfforts.activityStartAt),
      asc(activityBestEfforts.durationSeconds),
      asc(activityBestEfforts.id),
    );
}

function buildMonthlyTrendBuckets({
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

      if (!row || toDate(row.activityStartAt) >= bucket.bucketEndAt) {
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

function createMonthlyBuckets(year: number): MonthBucket[] {
  return Array.from({ length: 12 }, (_, month) => {
    const bucketStartAt = getBrisbaneCalendarDateStartAt(year, month, 1);
    const bucketEndAt = getBrisbaneCalendarDateStartAt(year, month + 1, 1);

    return { bucketEndAt, bucketStartAt };
  });
}

function getBrisbaneCalendarDateStartAt(
  year: number,
  monthIndex: number,
  day: number,
) {
  return new Date(
    Date.UTC(year, monthIndex, day) -
      brisbaneUtcOffsetHours * millisecondsPerHour,
  );
}

function sortByStandardDistance<T extends { standardDistanceCode: string }>(
  efforts: T[],
) {
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

function toPersonalBestEffort(row: ActivityBestEffortRow): PersonalBestEffort {
  return {
    ...row,
    activityStartAt: toDate(row.activityStartAt),
  };
}

function toDate(value: Date | string) {
  if (value instanceof Date) {
    return value;
  }

  return new Date(`${value.replace(" ", "T")}Z`);
}

type MonthBucket = {
  bucketEndAt: Date;
  bucketStartAt: Date;
};
