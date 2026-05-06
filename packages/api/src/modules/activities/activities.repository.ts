import {
  activities,
  activityLaps,
  activityMaps,
  activityStreams,
  db,
} from "@korex/db";
import { eq } from "drizzle-orm";
import type {
  ActivityInput,
  ActivityLapInput,
  ActivityMapInput,
  ActivityStreamInput,
} from "./activities.types";

type ActivityDatabase = Pick<typeof db, "delete" | "insert" | "update">;

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
