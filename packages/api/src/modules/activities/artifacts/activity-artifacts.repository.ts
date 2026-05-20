import { activityMaps, activityStreams, db } from "@korex/db";
import { eq } from "drizzle-orm";
import type {
  ActivityMapInput,
  ActivityStreamInput,
} from "../activities.types";

type ActivityDatabase = Pick<
  typeof db,
  "delete" | "insert" | "select" | "transaction" | "update"
>;

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
