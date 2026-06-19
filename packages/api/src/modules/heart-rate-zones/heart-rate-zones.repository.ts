import { db, heartRateZones } from "@korex/db";
import { asc, eq } from "drizzle-orm";
import type {
  HeartRateZone,
  HeartRateZoneSeedInput,
  HeartRateZoneWriteInput,
} from "./heart-rate-zones.types";

type HeartRateZoneDatabase = Pick<
  typeof db,
  "delete" | "insert" | "select" | "transaction"
>;

export async function listHeartRateZones({
  database = db,
  userId,
}: {
  database?: HeartRateZoneDatabase;
  userId: string;
}): Promise<HeartRateZone[]> {
  return database
    .select({
      id: heartRateZones.id,
      maxBpm: heartRateZones.maxBpm,
      minBpm: heartRateZones.minBpm,
      name: heartRateZones.name,
      position: heartRateZones.position,
    })
    .from(heartRateZones)
    .where(eq(heartRateZones.userId, userId))
    .orderBy(asc(heartRateZones.position));
}

export async function replaceHeartRateZones({
  userId,
  zones,
}: {
  userId: string;
  zones: HeartRateZoneWriteInput[];
}): Promise<HeartRateZone[]> {
  await db.transaction(async (tx) => {
    await tx.delete(heartRateZones).where(eq(heartRateZones.userId, userId));

    if (zones.length === 0) {
      return;
    }

    await tx.insert(heartRateZones).values(
      zones.map((zone) => ({
        maxBpm: zone.maxBpm,
        minBpm: zone.minBpm,
        name: zone.name,
        position: zone.position,
        userId,
      })),
    );
  });

  return listHeartRateZones({ userId });
}

export async function seedHeartRateZonesIfEmpty({
  userId,
  zones,
}: {
  userId: string;
  zones: HeartRateZoneSeedInput[];
}): Promise<HeartRateZone[]> {
  if (zones.length === 0) {
    return listHeartRateZones({ userId });
  }

  await db.transaction(async (tx) => {
    const existingZones = await listHeartRateZones({
      database: tx,
      userId,
    });

    if (existingZones.length > 0) {
      return;
    }

    await tx.insert(heartRateZones).values(
      zones.map((zone) => ({
        maxBpm: zone.range.maxBpm,
        minBpm: zone.range.minBpm,
        name: zone.name,
        position: zone.position,
        userId,
      })),
    );
  });

  return listHeartRateZones({ userId });
}
