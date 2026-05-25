import { activities, activityStreams, db } from "@korex/db";
import { and, eq, inArray } from "drizzle-orm";
import type { ActivityStreamInput } from "../activities.types";

const readableActivityStreamTypes = [
  "altitude",
  "cadence",
  "distance",
  "elapsedTime",
  "heartRate",
  "velocity",
] as const;

export type ActivityStreamsRecord = {
  elapsedTimeSeconds: number | null;
  movingTimeSeconds: number | null;
  streams: ActivityStreamInput[];
};

export async function getActivityStreamsRecord({
  activityId,
  userId,
}: {
  activityId: number;
  userId: string;
}): Promise<ActivityStreamsRecord | null> {
  const [activity] = await db
    .select({
      elapsedTimeSeconds: activities.elapsedTimeSeconds,
      id: activities.id,
      movingTimeSeconds: activities.movingTimeSeconds,
    })
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.userId, userId)));

  if (!activity) {
    return null;
  }

  const streams = await db
    .select({
      data: activityStreams.data,
      streamType: activityStreams.streamType,
    })
    .from(activityStreams)
    .where(
      and(
        eq(activityStreams.activityId, activity.id),
        inArray(activityStreams.streamType, [...readableActivityStreamTypes]),
      ),
    );

  return {
    elapsedTimeSeconds: activity.elapsedTimeSeconds,
    movingTimeSeconds: activity.movingTimeSeconds,
    streams,
  };
}
