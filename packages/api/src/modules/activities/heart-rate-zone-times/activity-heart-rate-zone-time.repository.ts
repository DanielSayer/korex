import {
  activities,
  activityHeartRateZoneSnapshots,
  activityHeartRateZoneTimeCalculationJobs,
  activityHeartRateZoneTimes,
  activityStreams,
  db,
  heartRateZones,
} from "@korex/db";
import { and, asc, eq } from "drizzle-orm";
import type {
  ActivityHeartRateZoneSnapshotInput,
  ActivityHeartRateZoneTimeInput,
  ActivityStreamInput,
} from "../activities.types";
import { replaceActivityStreams } from "../artifacts/activity-artifacts.repository";
import { enqueueActivityBestEffortCalculation } from "../best-efforts/activity-best-effort-jobs.repository";

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

export async function replaceActivityHeartRateZoneSnapshotsAndQueueCalculation({
  activityId,
  snapshots,
}: {
  activityId: number;
  snapshots: ActivityHeartRateZoneSnapshotInput[];
}) {
  await db.transaction(async (tx) => {
    await replaceActivityHeartRateZoneSnapshots({
      activityId,
      database: tx,
      snapshots,
    });

    await resetActivityHeartRateZoneCalculationJob(tx, activityId);
  });
}

export async function replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation({
  activityId,
  streams,
  userId,
}: {
  activityId: number;
  streams: ActivityStreamInput[];
  userId: string;
}) {
  await db.transaction(async (tx) => {
    await replaceActivityStreams({
      activityId,
      database: tx,
      streams,
    });
    await enqueueActivityBestEffortCalculation({
      activityId,
      database: tx,
    });

    const heartRateStream = streams.find(
      (stream) => stream.streamType === "heartRate",
    );

    if (!heartRateStream) {
      await replaceActivityHeartRateZoneSnapshots({
        activityId,
        database: tx,
        snapshots: [],
      });
      await clearActivityHeartRateZoneCalculation(tx, activityId);
      return;
    }

    const snapshots = await tx
      .select({
        maxBpm: heartRateZones.maxBpm,
        minBpm: heartRateZones.minBpm,
        name: heartRateZones.name,
        position: heartRateZones.position,
      })
      .from(heartRateZones)
      .where(eq(heartRateZones.userId, userId))
      .orderBy(asc(heartRateZones.position));

    if (snapshots.length === 0) {
      await replaceActivityHeartRateZoneSnapshots({
        activityId,
        database: tx,
        snapshots: [],
      });
      await clearActivityHeartRateZoneCalculation(tx, activityId);
      return;
    }

    await replaceActivityHeartRateZoneSnapshots({
      activityId,
      database: tx,
      snapshots,
    });

    await resetActivityHeartRateZoneCalculationJob(tx, activityId);
  });
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

async function clearActivityHeartRateZoneCalculation(
  database: ActivityDatabase,
  activityId: number,
) {
  await database
    .delete(activityHeartRateZoneTimes)
    .where(eq(activityHeartRateZoneTimes.activityId, activityId));
  await database
    .delete(activityHeartRateZoneTimeCalculationJobs)
    .where(eq(activityHeartRateZoneTimeCalculationJobs.activityId, activityId));
}

async function resetActivityHeartRateZoneCalculationJob(
  database: ActivityDatabase,
  activityId: number,
) {
  await database
    .delete(activityHeartRateZoneTimes)
    .where(eq(activityHeartRateZoneTimes.activityId, activityId));

  const now = new Date();

  await database
    .insert(activityHeartRateZoneTimeCalculationJobs)
    .values({
      activityId,
      attemptCount: 0,
      finishedAt: null,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
      runAfter: now,
      status: "pending",
    })
    .onConflictDoUpdate({
      target: [activityHeartRateZoneTimeCalculationJobs.activityId],
      set: {
        attemptCount: 0,
        finishedAt: null,
        lastError: null,
        lockedAt: null,
        lockedBy: null,
        runAfter: now,
        status: "pending",
        updatedAt: now,
      },
    });
}
