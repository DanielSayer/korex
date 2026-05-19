import {
  activities,
  activityStreams,
  db,
  externalActivities,
  externalActivityStreams,
} from "@korex/db";
import { and, eq, isNotNull } from "drizzle-orm";
import { enqueueActivityBestEffortCalculation } from "../modules/activities/best-efforts/activity-best-effort-jobs.repository";

type BackfillResult = {
  queuedActivityIds: Set<number>;
  skippedEmptyStreams: number;
  storedStreams: number;
  timeStreamsSeen: number;
};

const result = await storeExternalTimeStreams();

console.info(
  [
    `Found ${result.timeStreamsSeen} linked external time streams`,
    `Stored ${result.storedStreams} core elapsed-time streams`,
    `Queued ${result.queuedActivityIds.size} activities for best-effort calculation`,
    `Skipped ${result.skippedEmptyStreams} streams without numeric samples`,
  ].join("\n"),
);

async function storeExternalTimeStreams(): Promise<BackfillResult> {
  const rows = await db
    .select({
      activityId: externalActivities.activityId,
      rawData: externalActivityStreams.rawData,
    })
    .from(externalActivityStreams)
    .innerJoin(
      externalActivities,
      eq(externalActivities.id, externalActivityStreams.externalActivityId),
    )
    .innerJoin(activities, eq(activities.id, externalActivities.activityId))
    .where(
      and(
        eq(externalActivityStreams.streamType, "time"),
        isNotNull(externalActivities.activityId),
      ),
    );

  const backfillResult: BackfillResult = {
    queuedActivityIds: new Set(),
    skippedEmptyStreams: 0,
    storedStreams: 0,
    timeStreamsSeen: rows.length,
  };

  for (const row of rows) {
    if (row.activityId === null) {
      continue;
    }

    const data = readNumericStreamData(row.rawData);

    if (data.length === 0) {
      backfillResult.skippedEmptyStreams += 1;
      continue;
    }

    await db.transaction(async (tx) => {
      await tx
        .insert(activityStreams)
        .values({
          activityId: row.activityId,
          data,
          streamType: "elapsedTime",
        })
        .onConflictDoUpdate({
          target: [activityStreams.activityId, activityStreams.streamType],
          set: {
            data,
            updatedAt: new Date(),
          },
        });

      await enqueueActivityBestEffortCalculation({
        activityId: row.activityId,
        database: tx,
      });
    });

    backfillResult.storedStreams += 1;
    backfillResult.queuedActivityIds.add(row.activityId);
  }

  return backfillResult;
}

function readNumericStreamData(rawData: unknown) {
  const values = readRawStreamData(rawData);

  if (!values) {
    return [];
  }

  return values.flatMap((value) =>
    typeof value === "number" && Number.isFinite(value) ? [value] : [],
  );
}

function readRawStreamData(rawData: unknown) {
  if (!isRecord(rawData)) {
    return null;
  }

  if (Array.isArray(rawData.data)) {
    return rawData.data;
  }

  if (Array.isArray(rawData.data2)) {
    return rawData.data2;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
