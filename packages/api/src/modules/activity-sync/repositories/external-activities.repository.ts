import { createHash } from "node:crypto";
import {
  db,
  externalActivities,
  externalActivityMaps,
  externalActivityStreams,
} from "@korex/db";
import { and, eq } from "drizzle-orm";

type ExternalActivityDatabase = Pick<typeof db, "update">;

export type UpsertExternalActivityInput = {
  activityEndAt: Date | null;
  activityStartAt: Date;
  lastSyncRunId: number;
  provider: "intervals_icu";
  providerActivityId: string;
  providerAthleteId: string;
  providerUpdatedAt: Date | null;
  rawData: unknown;
  sourceType: string | null;
  sportType: string | null;
  userId: string;
};

export type UpsertExternalActivityResult = {
  activityId: number | null;
  created: boolean;
  externalActivityId: number;
  updated: boolean;
};

export async function upsertExternalActivity({
  activityEndAt,
  activityStartAt,
  lastSyncRunId,
  provider,
  providerActivityId,
  providerAthleteId,
  providerUpdatedAt,
  rawData,
  sourceType,
  sportType,
  userId,
}: UpsertExternalActivityInput): Promise<UpsertExternalActivityResult> {
  const payloadHash = hashPayload(rawData);
  const [existing] = await db
    .select({
      activityId: externalActivities.activityId,
      id: externalActivities.id,
      payloadHash: externalActivities.payloadHash,
    })
    .from(externalActivities)
    .where(
      and(
        eq(externalActivities.userId, userId),
        eq(externalActivities.provider, provider),
        eq(externalActivities.providerActivityId, providerActivityId),
      ),
    )
    .limit(1);

  if (!existing) {
    const [inserted] = await db
      .insert(externalActivities)
      .values({
        activityEndAt,
        activityStartAt,
        lastSeenAt: new Date(),
        lastSyncRunId,
        payloadHash,
        provider,
        providerActivityId,
        providerAthleteId,
        providerUpdatedAt,
        rawData,
        sourceType,
        sportType,
        userId,
      })
      .returning({ id: externalActivities.id });

    if (!inserted) {
      throw new Error("Failed to insert external activity");
    }

    return {
      activityId: null,
      created: true,
      externalActivityId: inserted.id,
      updated: false,
    };
  }

  await db
    .update(externalActivities)
    .set({
      activityEndAt,
      activityStartAt,
      deletedAt: null,
      lastSeenAt: new Date(),
      lastSyncRunId,
      payloadHash,
      providerAthleteId,
      providerUpdatedAt,
      rawData,
      sourceType,
      sportType,
      updatedAt: new Date(),
    })
    .where(eq(externalActivities.id, existing.id));

  return {
    created: false,
    activityId: existing.activityId,
    externalActivityId: existing.id,
    updated: existing.payloadHash !== payloadHash,
  };
}

export async function linkExternalActivityToActivity({
  activityId,
  database = db,
  externalActivityId,
}: {
  activityId: number;
  database?: ExternalActivityDatabase;
  externalActivityId: number;
}) {
  await database
    .update(externalActivities)
    .set({
      activityId,
      updatedAt: new Date(),
    })
    .where(eq(externalActivities.id, externalActivityId));
}

export async function clearExternalActivityActivityLink(
  externalActivityId: number,
  database: ExternalActivityDatabase = db,
) {
  await database
    .update(externalActivities)
    .set({
      activityId: null,
      updatedAt: new Date(),
    })
    .where(eq(externalActivities.id, externalActivityId));
}

export async function upsertExternalActivityMap({
  externalActivityId,
  lastSyncRunId,
  provider,
  providerActivityId,
  rawData,
  userId,
}: {
  externalActivityId: number;
  lastSyncRunId: number;
  provider: "intervals_icu";
  providerActivityId: string;
  rawData: unknown;
  userId: string;
}) {
  const payloadHash = hashPayload(rawData);

  await db
    .insert(externalActivityMaps)
    .values({
      externalActivityId,
      lastSeenAt: new Date(),
      lastSyncRunId,
      payloadHash,
      provider,
      providerActivityId,
      rawData,
      userId,
    })
    .onConflictDoUpdate({
      target: [externalActivityMaps.externalActivityId],
      set: {
        lastSeenAt: new Date(),
        lastSyncRunId,
        payloadHash,
        rawData,
        updatedAt: new Date(),
      },
    });
}

export async function upsertExternalActivityStream({
  externalActivityId,
  lastSyncRunId,
  provider,
  providerActivityId,
  rawData,
  streamType,
  userId,
}: {
  externalActivityId: number;
  lastSyncRunId: number;
  provider: "intervals_icu";
  providerActivityId: string;
  rawData: unknown;
  streamType: string;
  userId: string;
}) {
  const payloadHash = hashPayload(rawData);

  await db
    .insert(externalActivityStreams)
    .values({
      externalActivityId,
      lastSeenAt: new Date(),
      lastSyncRunId,
      payloadHash,
      provider,
      providerActivityId,
      rawData,
      streamType,
      userId,
    })
    .onConflictDoUpdate({
      target: [
        externalActivityStreams.externalActivityId,
        externalActivityStreams.streamType,
      ],
      set: {
        lastSeenAt: new Date(),
        lastSyncRunId,
        payloadHash,
        rawData,
        updatedAt: new Date(),
      },
    });
}

function hashPayload(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
