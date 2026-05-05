import { activities, db } from "@korex/db";
import { eq } from "drizzle-orm";
import type { ActivityInput } from "./activities.types";

export type UpsertActivityResult = {
  activityId: number;
  created: boolean;
};

export async function upsertActivity({
  activityId,
  input,
}: {
  activityId: number | null;
  input: ActivityInput;
}): Promise<UpsertActivityResult> {
  if (activityId) {
    await db
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

  const [inserted] = await db
    .insert(activities)
    .values(input)
    .returning({ id: activities.id });

  if (!inserted) {
    throw new Error("Failed to insert activity");
  }

  return { activityId: inserted.id, created: true };
}

export async function deleteActivity(activityId: number) {
  await db.delete(activities).where(eq(activities.id, activityId));
}
