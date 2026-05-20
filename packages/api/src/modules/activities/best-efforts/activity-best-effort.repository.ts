import {
  activities,
  activityBestEfforts,
  activityStreams,
  db,
  personalBestEfforts,
} from "@korex/db";
import { and, asc, eq, inArray } from "drizzle-orm";
import type {
  ActivityBestEffortInput,
  BestEffortStandardDistanceCode,
} from "../activities.types";

type ActivityBestEffortDatabase = Pick<
  typeof db,
  "delete" | "insert" | "select" | "transaction" | "update"
>;

export async function getActivityBestEffortCalculationInputs({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityBestEffortDatabase;
}) {
  const [activity] = await database
    .select({
      activityStartAt: activities.startAt,
      sportType: activities.sportType,
      userId: activities.userId,
    })
    .from(activities)
    .where(eq(activities.id, activityId));

  const streams = await database
    .select({
      data: activityStreams.data,
      streamType: activityStreams.streamType,
    })
    .from(activityStreams)
    .where(
      and(
        eq(activityStreams.activityId, activityId),
        inArray(activityStreams.streamType, ["distance", "elapsedTime"]),
      ),
    );

  return {
    activity: activity ?? null,
    distanceSamples:
      streams.find((stream) => stream.streamType === "distance")?.data ?? [],
    elapsedTimeSamples:
      streams.find((stream) => stream.streamType === "elapsedTime")?.data ?? [],
  };
}

export async function replaceActivityBestEfforts({
  activityId,
  activityStartAt,
  database = db,
  efforts,
  sportType,
  userId,
}: {
  activityId: number;
  activityStartAt: Date;
  database?: ActivityBestEffortDatabase;
  efforts: ActivityBestEffortInput[];
  sportType: "run" | "treadmill" | "hike";
  userId: string;
}) {
  const existing = await database
    .select({ standardDistanceCode: activityBestEfforts.standardDistanceCode })
    .from(activityBestEfforts)
    .where(eq(activityBestEfforts.activityId, activityId));
  const affectedDistanceCodes = new Set<BestEffortStandardDistanceCode>(
    existing.map((effort) => effort.standardDistanceCode),
  );

  await database
    .delete(activityBestEfforts)
    .where(eq(activityBestEfforts.activityId, activityId));

  for (const effort of efforts) {
    affectedDistanceCodes.add(effort.standardDistanceCode);
  }

  if (efforts.length > 0) {
    await database.insert(activityBestEfforts).values(
      efforts.map((effort) => ({
        activityId,
        activityStartAt,
        distanceMeters: effort.distanceMeters,
        durationSeconds: effort.durationSeconds,
        endDistanceMeters: effort.endDistanceMeters,
        endElapsedTimeSeconds: effort.endElapsedTimeSeconds,
        sportType,
        standardDistanceCode: effort.standardDistanceCode,
        startDistanceMeters: effort.startDistanceMeters,
        startElapsedTimeSeconds: effort.startElapsedTimeSeconds,
        userId,
      })),
    );
  }

  return [...affectedDistanceCodes];
}

export async function refreshPersonalBestEfforts({
  database = db,
  standardDistanceCodes,
  userId,
}: {
  database?: ActivityBestEffortDatabase;
  standardDistanceCodes: BestEffortStandardDistanceCode[];
  userId: string;
}) {
  for (const standardDistanceCode of standardDistanceCodes) {
    const [bestEffort] = await database
      .select({
        activityBestEffortId: activityBestEfforts.id,
        activityId: activityBestEfforts.activityId,
        activityStartAt: activityBestEfforts.activityStartAt,
        distanceMeters: activityBestEfforts.distanceMeters,
        durationSeconds: activityBestEfforts.durationSeconds,
        endElapsedTimeSeconds: activityBestEfforts.endElapsedTimeSeconds,
        sportType: activityBestEfforts.sportType,
        standardDistanceCode: activityBestEfforts.standardDistanceCode,
        startElapsedTimeSeconds: activityBestEfforts.startElapsedTimeSeconds,
      })
      .from(activityBestEfforts)
      .where(
        and(
          eq(activityBestEfforts.userId, userId),
          eq(activityBestEfforts.standardDistanceCode, standardDistanceCode),
        ),
      )
      .orderBy(
        asc(activityBestEfforts.durationSeconds),
        asc(activityBestEfforts.activityStartAt),
        asc(activityBestEfforts.id),
      )
      .limit(1);

    if (!bestEffort) {
      await database
        .delete(personalBestEfforts)
        .where(
          and(
            eq(personalBestEfforts.userId, userId),
            eq(personalBestEfforts.standardDistanceCode, standardDistanceCode),
          ),
        );
      continue;
    }

    const now = new Date();

    await database
      .insert(personalBestEfforts)
      .values({
        activityBestEffortId: bestEffort.activityBestEffortId,
        activityId: bestEffort.activityId,
        activityStartAt: bestEffort.activityStartAt,
        distanceMeters: bestEffort.distanceMeters,
        durationSeconds: bestEffort.durationSeconds,
        endElapsedTimeSeconds: bestEffort.endElapsedTimeSeconds,
        sportType: bestEffort.sportType,
        standardDistanceCode: bestEffort.standardDistanceCode,
        startElapsedTimeSeconds: bestEffort.startElapsedTimeSeconds,
        userId,
      })
      .onConflictDoUpdate({
        target: [
          personalBestEfforts.userId,
          personalBestEfforts.standardDistanceCode,
        ],
        set: {
          activityBestEffortId: bestEffort.activityBestEffortId,
          activityId: bestEffort.activityId,
          activityStartAt: bestEffort.activityStartAt,
          distanceMeters: bestEffort.distanceMeters,
          durationSeconds: bestEffort.durationSeconds,
          endElapsedTimeSeconds: bestEffort.endElapsedTimeSeconds,
          sportType: bestEffort.sportType,
          startElapsedTimeSeconds: bestEffort.startElapsedTimeSeconds,
          updatedAt: now,
        },
      });
  }
}
