import {
  activities,
  activityBestEfforts,
  activityHeartRateZoneSnapshots,
  activityHeartRateZoneTimes,
  activityLaps,
  activityMaps,
  db,
} from "@korex/db";
import { and, asc, eq } from "drizzle-orm";
import type {
  ActivityBestEffortSummary,
  ActivityDetailSummary,
  ActivityDetailSummaryActivity,
  ActivityHeartRateZoneSnapshotInput,
  ActivityHeartRateZoneTimeInput,
  ActivityLapSummary,
  ActivityMapInput,
} from "../activities.types";

export type ActivityDetailSummaryRecord = Omit<ActivityDetailSummary, "map"> & {
  map: ActivityMapInput | null;
};

export async function getActivityDetailSummaryRecord({
  activityId,
  userId,
}: {
  activityId: number;
  userId: string;
}): Promise<ActivityDetailSummaryRecord | null> {
  const [activity] = await db
    .select({
      averageCadenceStepsPerMinute: activities.averageCadenceStepsPerMinute,
      averageHeartRateBeatsPerMinute: activities.averageHeartRateBeatsPerMinute,
      averageSpeedMetersPerSecond: activities.averageSpeedMetersPerSecond,
      deviceName: activities.deviceName,
      distanceMeters: activities.distanceMeters,
      elapsedTimeSeconds: activities.elapsedTimeSeconds,
      energyKilocalories: activities.energyKilocalories,
      id: activities.id,
      maxHeartRateBeatsPerMinute: activities.maxHeartRateBeatsPerMinute,
      maxSpeedMetersPerSecond: activities.maxSpeedMetersPerSecond,
      movingTimeSeconds: activities.movingTimeSeconds,
      name: activities.name,
      sportType: activities.sportType,
      startAt: activities.startAt,
      totalElevationGainMeters: activities.totalElevationGainMeters,
      totalElevationLossMeters: activities.totalElevationLossMeters,
    })
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.userId, userId)));

  if (!activity) {
    return null;
  }

  const [map, laps, heartRateZoneSnapshots, heartRateZoneTimes, bestEfforts] =
    await Promise.all([
      getActivityMapRecord(activity.id),
      listActivityLapRecords(activity.id),
      listActivityHeartRateZoneSnapshotRecords(activity.id),
      listActivityHeartRateZoneTimeRecords(activity.id),
      listActivityBestEffortRecords(activity.id),
    ]);

  return {
    activity,
    bestEfforts,
    heartRateZoneSnapshots,
    heartRateZoneTimes,
    laps,
    map,
  };
}

async function getActivityMapRecord(
  activityId: number,
): Promise<ActivityMapInput | null> {
  const [map] = await db
    .select({
      bounds: activityMaps.bounds,
      coordinates: activityMaps.coordinates,
    })
    .from(activityMaps)
    .where(eq(activityMaps.activityId, activityId));

  return map ?? null;
}

function listActivityLapRecords(
  activityId: ActivityDetailSummaryActivity["id"],
): Promise<ActivityLapSummary[]> {
  return db
    .select({
      averageCadenceStepsPerMinute: activityLaps.averageCadenceStepsPerMinute,
      averageHeartRateBeatsPerMinute:
        activityLaps.averageHeartRateBeatsPerMinute,
      averageSpeedMetersPerSecond: activityLaps.averageSpeedMetersPerSecond,
      averageStrideLengthMeters: activityLaps.averageStrideLengthMeters,
      distanceMeters: activityLaps.distanceMeters,
      elapsedTimeSeconds: activityLaps.elapsedTimeSeconds,
      endTimeSeconds: activityLaps.endTimeSeconds,
      id: activityLaps.id,
      index: activityLaps.index,
      maxHeartRateBeatsPerMinute: activityLaps.maxHeartRateBeatsPerMinute,
      maxSpeedMetersPerSecond: activityLaps.maxSpeedMetersPerSecond,
      movingTimeSeconds: activityLaps.movingTimeSeconds,
      startTimeSeconds: activityLaps.startTimeSeconds,
      totalElevationGainMeters: activityLaps.totalElevationGainMeters,
    })
    .from(activityLaps)
    .where(eq(activityLaps.activityId, activityId))
    .orderBy(asc(activityLaps.index));
}

function listActivityHeartRateZoneSnapshotRecords(
  activityId: ActivityDetailSummaryActivity["id"],
): Promise<ActivityHeartRateZoneSnapshotInput[]> {
  return db
    .select({
      maxBpm: activityHeartRateZoneSnapshots.maxBpm,
      minBpm: activityHeartRateZoneSnapshots.minBpm,
      name: activityHeartRateZoneSnapshots.name,
      position: activityHeartRateZoneSnapshots.position,
    })
    .from(activityHeartRateZoneSnapshots)
    .where(eq(activityHeartRateZoneSnapshots.activityId, activityId))
    .orderBy(asc(activityHeartRateZoneSnapshots.position));
}

function listActivityHeartRateZoneTimeRecords(
  activityId: ActivityDetailSummaryActivity["id"],
): Promise<ActivityHeartRateZoneTimeInput[]> {
  return db
    .select({
      position: activityHeartRateZoneTimes.position,
      timeSeconds: activityHeartRateZoneTimes.timeSeconds,
    })
    .from(activityHeartRateZoneTimes)
    .where(eq(activityHeartRateZoneTimes.activityId, activityId))
    .orderBy(asc(activityHeartRateZoneTimes.position));
}

function listActivityBestEffortRecords(
  activityId: ActivityDetailSummaryActivity["id"],
): Promise<ActivityBestEffortSummary[]> {
  return db
    .select({
      distanceMeters: activityBestEfforts.distanceMeters,
      durationSeconds: activityBestEfforts.durationSeconds,
      endDistanceMeters: activityBestEfforts.endDistanceMeters,
      endElapsedTimeSeconds: activityBestEfforts.endElapsedTimeSeconds,
      standardDistanceCode: activityBestEfforts.standardDistanceCode,
      startDistanceMeters: activityBestEfforts.startDistanceMeters,
      startElapsedTimeSeconds: activityBestEfforts.startElapsedTimeSeconds,
    })
    .from(activityBestEfforts)
    .where(eq(activityBestEfforts.activityId, activityId))
    .orderBy(asc(activityBestEfforts.distanceMeters));
}
