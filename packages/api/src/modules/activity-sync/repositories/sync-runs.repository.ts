import { db, syncRuns } from "@korex/db";
import { and, desc, eq } from "drizzle-orm";

type SyncRunStatus = "pending" | "running" | "success" | "failed" | "partial";
type SyncType = "initial" | "incremental" | "manual" | "backfill";

export async function createActivitySyncRun({
  provider,
  syncType,
  userId,
}: {
  provider: "intervals_icu";
  syncType: SyncType;
  userId: string;
}) {
  const [syncRun] = await db
    .insert(syncRuns)
    .values({
      provider,
      status: "running",
      syncType,
      userId,
    })
    .returning({ id: syncRuns.id });

  if (!syncRun) {
    throw new Error("Failed to create activity sync run");
  }

  return syncRun;
}

export async function finishActivitySyncRun({
  activitiesCreated,
  activitiesSeen,
  activitiesUpdated,
  errorCode,
  errorMessage,
  metadata,
  status,
  syncRunId,
}: {
  activitiesCreated: number;
  activitiesSeen: number;
  activitiesUpdated: number;
  errorCode?: string;
  errorMessage?: string;
  metadata?: unknown;
  status: SyncRunStatus;
  syncRunId: number;
}) {
  await db
    .update(syncRuns)
    .set({
      activitiesCreated,
      activitiesSeen,
      activitiesUpdated,
      errorCode,
      errorMessage,
      finishedAt: new Date(),
      metadata,
      status,
      updatedAt: new Date(),
    })
    .where(eq(syncRuns.id, syncRunId));
}

export async function hasSuccessfulActivitySyncRunForUser(userId: string) {
  const [syncRun] = await db
    .select({ id: syncRuns.id })
    .from(syncRuns)
    .where(and(eq(syncRuns.userId, userId), eq(syncRuns.status, "success")))
    .limit(1);

  return syncRun !== undefined;
}

export async function getLatestSuccessfulActivitySyncRunForUser(
  userId: string,
) {
  const [syncRun] = await db
    .select({
      id: syncRuns.id,
      startedAt: syncRuns.startedAt,
    })
    .from(syncRuns)
    .where(and(eq(syncRuns.userId, userId), eq(syncRuns.status, "success")))
    .orderBy(desc(syncRuns.startedAt))
    .limit(1);

  return syncRun ?? null;
}
