import {
  activities,
  activityHeartRateZoneSnapshots,
  activityHeartRateZoneTimes,
  activityStreams,
  db,
  heartRateZones,
} from "@korex/db";
import { and, asc, eq } from "drizzle-orm";
import type {
  ActivityHeartRateZoneSnapshotInput,
  ActivityHeartRateZoneTimeInput,
} from "../activities.types";

type ActivityDatabase = Pick<
  typeof db,
  "delete" | "insert" | "select" | "transaction" | "update"
>;

export async function replaceActivityHeartRateZoneSnapshots({
  activityId,
  database = db,
  snapshots,
}: {
  activityId: number;
  database?: ActivityDatabase;
  snapshots: ActivityHeartRateZoneSnapshotInput[];
}) {
  await database
    .delete(activityHeartRateZoneSnapshots)
    .where(eq(activityHeartRateZoneSnapshots.activityId, activityId));

  if (snapshots.length === 0) {
    return;
  }

  await database.insert(activityHeartRateZoneSnapshots).values(
    snapshots.map((snapshot) => ({
      activityId,
      maxBpm: snapshot.maxBpm,
      minBpm: snapshot.minBpm,
      name: snapshot.name,
      position: snapshot.position,
    })),
  );
}

export async function replaceActivityHeartRateZoneTimes({
  activityId,
  database = db,
  times,
}: {
  activityId: number;
  database?: ActivityDatabase;
  times: ActivityHeartRateZoneTimeInput[];
}) {
  await database
    .delete(activityHeartRateZoneTimes)
    .where(eq(activityHeartRateZoneTimes.activityId, activityId));

  if (times.length === 0) {
    return;
  }

  await database.insert(activityHeartRateZoneTimes).values(
    times.map((time) => ({
      activityId,
      position: time.position,
      timeSeconds: time.timeSeconds,
    })),
  );
}

export async function getActivityHeartRateZoneCalculationInputs({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityDatabase;
}) {
  const [activity] = await database
    .select({
      movingTimeSeconds: activities.movingTimeSeconds,
    })
    .from(activities)
    .where(eq(activities.id, activityId));

  const [heartRateStream] = await database
    .select({
      data: activityStreams.data,
    })
    .from(activityStreams)
    .where(
      and(
        eq(activityStreams.activityId, activityId),
        eq(activityStreams.streamType, "heartRate"),
      ),
    );

  const snapshots = await database
    .select({
      maxBpm: activityHeartRateZoneSnapshots.maxBpm,
      minBpm: activityHeartRateZoneSnapshots.minBpm,
      name: activityHeartRateZoneSnapshots.name,
      position: activityHeartRateZoneSnapshots.position,
    })
    .from(activityHeartRateZoneSnapshots)
    .where(eq(activityHeartRateZoneSnapshots.activityId, activityId));

  return {
    heartRateSamples: heartRateStream?.data ?? [],
    movingTimeSeconds: activity?.movingTimeSeconds ?? null,
    snapshots,
  };
}

export async function clearActivityHeartRateZoneCalculation({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityDatabase;
}) {
  await database
    .delete(activityHeartRateZoneTimes)
    .where(eq(activityHeartRateZoneTimes.activityId, activityId));
  await database
    .delete(activityHeartRateZoneSnapshots)
    .where(eq(activityHeartRateZoneSnapshots.activityId, activityId));
}

export async function clearActivityHeartRateZoneTimes({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityDatabase;
}) {
  await database
    .delete(activityHeartRateZoneTimes)
    .where(eq(activityHeartRateZoneTimes.activityId, activityId));
}

export async function listUserHeartRateZoneSnapshots({
  database = db,
  userId,
}: {
  database?: ActivityDatabase;
  userId: string;
}): Promise<ActivityHeartRateZoneSnapshotInput[]> {
  return database
    .select({
      maxBpm: heartRateZones.maxBpm,
      minBpm: heartRateZones.minBpm,
      name: heartRateZones.name,
      position: heartRateZones.position,
    })
    .from(heartRateZones)
    .where(eq(heartRateZones.userId, userId))
    .orderBy(asc(heartRateZones.position));
}
