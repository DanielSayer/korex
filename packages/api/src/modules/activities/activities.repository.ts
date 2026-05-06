import {
  activities,
  activityHeartRateZoneSnapshots,
  activityHeartRateZoneTimeCalculationJobs,
  activityHeartRateZoneTimes,
  activityLaps,
  activityMaps,
  activityStreams,
  db,
  heartRateZones,
} from "@korex/db";
import { and, asc, eq } from "drizzle-orm";
import type {
  ActivityHeartRateZoneSnapshotInput,
  ActivityHeartRateZoneTimeInput,
  ActivityInput,
  ActivityLapInput,
  ActivityMapInput,
  ActivityStreamInput,
} from "./activities.types";

type ActivityDatabase = Pick<
  typeof db,
  "delete" | "insert" | "select" | "transaction" | "update"
>;

export type UpsertActivityResult = {
  activityId: number;
  created: boolean;
};

export async function upsertActivity({
  activityId,
  database = db,
  input,
}: {
  activityId: number | null;
  database?: ActivityDatabase;
  input: ActivityInput;
}): Promise<UpsertActivityResult> {
  if (activityId) {
    await database
      .update(activities)
      .set({
        averageCadenceStepsPerMinute: input.averageCadenceStepsPerMinute,
        averageHeartRateBeatsPerMinute: input.averageHeartRateBeatsPerMinute,
        averageSpeedMetersPerSecond: input.averageSpeedMetersPerSecond,
        deviceName: input.deviceName,
        distanceMeters: input.distanceMeters,
        elapsedTimeSeconds: input.elapsedTimeSeconds,
        energyKilocalories: input.energyKilocalories,
        maxHeartRateBeatsPerMinute: input.maxHeartRateBeatsPerMinute,
        maxSpeedMetersPerSecond: input.maxSpeedMetersPerSecond,
        movingTimeSeconds: input.movingTimeSeconds,
        name: input.name,
        sportType: input.sportType,
        startAt: input.startAt,
        totalElevationGainMeters: input.totalElevationGainMeters,
        totalElevationLossMeters: input.totalElevationLossMeters,
        updatedAt: new Date(),
      })
      .where(eq(activities.id, activityId));

    return { activityId, created: false };
  }

  const [inserted] = await database
    .insert(activities)
    .values(input)
    .returning({ id: activities.id });

  if (!inserted) {
    throw new Error("Failed to insert activity");
  }

  return { activityId: inserted.id, created: true };
}

export async function deleteActivity(
  activityId: number,
  database: ActivityDatabase = db,
) {
  await database.delete(activities).where(eq(activities.id, activityId));
}

export async function replaceActivityLaps({
  activityId,
  database = db,
  laps,
}: {
  activityId: number;
  database?: ActivityDatabase;
  laps: ActivityLapInput[];
}) {
  await database
    .delete(activityLaps)
    .where(eq(activityLaps.activityId, activityId));

  if (laps.length === 0) {
    return;
  }

  await database.insert(activityLaps).values(
    laps.map((lap) => ({
      activityId,
      averageCadenceStepsPerMinute: lap.averageCadenceStepsPerMinute,
      averageHeartRateBeatsPerMinute: lap.averageHeartRateBeatsPerMinute,
      averageSpeedMetersPerSecond: lap.averageSpeedMetersPerSecond,
      averageStrideLengthMeters: lap.averageStrideLengthMeters,
      distanceMeters: lap.distanceMeters,
      elapsedTimeSeconds: lap.elapsedTimeSeconds,
      endTimeSeconds: lap.endTimeSeconds,
      index: lap.index,
      maxHeartRateBeatsPerMinute: lap.maxHeartRateBeatsPerMinute,
      maxSpeedMetersPerSecond: lap.maxSpeedMetersPerSecond,
      movingTimeSeconds: lap.movingTimeSeconds,
      startTimeSeconds: lap.startTimeSeconds,
      totalElevationGainMeters: lap.totalElevationGainMeters,
    })),
  );
}

export async function replaceActivityMap({
  activityId,
  database = db,
  map,
}: {
  activityId: number;
  database?: ActivityDatabase;
  map: ActivityMapInput;
}) {
  await database
    .insert(activityMaps)
    .values({
      activityId,
      bounds: map.bounds,
      coordinates: map.coordinates,
    })
    .onConflictDoUpdate({
      target: [activityMaps.activityId],
      set: {
        bounds: map.bounds,
        coordinates: map.coordinates,
        updatedAt: new Date(),
      },
    });
}

export async function replaceActivityStreams({
  activityId,
  database = db,
  streams,
}: {
  activityId: number;
  database?: ActivityDatabase;
  streams: ActivityStreamInput[];
}) {
  await database
    .delete(activityStreams)
    .where(eq(activityStreams.activityId, activityId));

  if (streams.length === 0) {
    return;
  }

  await database.insert(activityStreams).values(
    streams.map((stream) => ({
      activityId,
      data: stream.data,
      streamType: stream.streamType,
    })),
  );
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

    const heartRateStream = streams.find(
      (stream) => stream.streamType === "heartRate",
    );

    if (!heartRateStream) {
      await replaceActivityHeartRateZoneSnapshots({
        activityId,
        database: tx,
        snapshots: [],
      });
      await tx
        .delete(activityHeartRateZoneTimes)
        .where(eq(activityHeartRateZoneTimes.activityId, activityId));
      await tx
        .delete(activityHeartRateZoneTimeCalculationJobs)
        .where(
          eq(activityHeartRateZoneTimeCalculationJobs.activityId, activityId),
        );
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
      await tx
        .delete(activityHeartRateZoneTimes)
        .where(eq(activityHeartRateZoneTimes.activityId, activityId));
      await tx
        .delete(activityHeartRateZoneTimeCalculationJobs)
        .where(
          eq(activityHeartRateZoneTimeCalculationJobs.activityId, activityId),
        );
      return;
    }

    await replaceActivityHeartRateZoneSnapshots({
      activityId,
      database: tx,
      snapshots,
    });

    await tx
      .delete(activityHeartRateZoneTimes)
      .where(eq(activityHeartRateZoneTimes.activityId, activityId));

    await tx
      .insert(activityHeartRateZoneTimeCalculationJobs)
      .values({
        activityId,
        attemptCount: 0,
        finishedAt: null,
        lastError: null,
        lockedAt: null,
        lockedBy: null,
        runAfter: new Date(),
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
          runAfter: new Date(),
          status: "pending",
          updatedAt: new Date(),
        },
      });
  });
}

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

    await tx
      .delete(activityHeartRateZoneTimes)
      .where(eq(activityHeartRateZoneTimes.activityId, activityId));

    await tx
      .insert(activityHeartRateZoneTimeCalculationJobs)
      .values({
        activityId,
        attemptCount: 0,
        finishedAt: null,
        lastError: null,
        lockedAt: null,
        lockedBy: null,
        runAfter: new Date(),
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
          runAfter: new Date(),
          status: "pending",
          updatedAt: new Date(),
        },
      });
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
