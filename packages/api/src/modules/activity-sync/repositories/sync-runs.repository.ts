import { db, syncRuns } from "@korex/db";
import { and, desc, eq, inArray } from "drizzle-orm";

type SyncRunDatabase = Pick<typeof db, "insert">;

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

export async function createQueuedActivitySyncRun({
  database = db,
  provider,
  syncType,
  userId,
}: {
  database?: SyncRunDatabase;
  provider: "intervals_icu";
  syncType: "initial" | "incremental";
  userId: string;
}) {
  const [syncRun] = await database
    .insert(syncRuns)
    .values({ provider, status: "pending", syncType, userId })
    .returning({ id: syncRuns.id });

  if (!syncRun) throw new Error("Failed to create queued activity sync run");
  return syncRun;
}

export async function claimActivitySyncRun(syncRunId: number) {
  const [claimed] = await db
    .update(syncRuns)
    .set({ status: "running", updatedAt: new Date() })
    .where(and(eq(syncRuns.id, syncRunId), eq(syncRuns.status, "pending")))
    .returning({ id: syncRuns.id });
  return claimed !== undefined;
}

export async function getActivitySyncRunForTask(syncRunId: number) {
  const [syncRun] = await db
    .select({
      id: syncRuns.id,
      startedAt: syncRuns.startedAt,
      status: syncRuns.status,
      syncType: syncRuns.syncType,
      userId: syncRuns.userId,
    })
    .from(syncRuns)
    .where(eq(syncRuns.id, syncRunId))
    .limit(1);

  if (
    !syncRun ||
    (syncRun.syncType !== "initial" && syncRun.syncType !== "incremental")
  ) {
    return null;
  }
  return { ...syncRun, syncType: syncRun.syncType };
}

export async function resetActivitySyncRunForRetry(syncRunId: number) {
  await db
    .update(syncRuns)
    .set({
      activitiesCreated: 0,
      activitiesSeen: 0,
      activitiesUpdated: 0,
      errorCode: null,
      errorMessage: null,
      finishedAt: null,
      metadata: null,
      status: "pending",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(syncRuns.id, syncRunId),
        inArray(syncRuns.status, ["running", "failed"]),
      ),
    );
}

export async function markActivitySyncRunExecutionFailed({
  message,
  syncRunId,
}: {
  message: string;
  syncRunId: number;
}) {
  await finishActivitySyncRun({
    activitiesCreated: 0,
    activitiesSeen: 0,
    activitiesUpdated: 0,
    errorCode: "provider_connection",
    errorMessage: message,
    status: "failed",
    syncRunId,
  });
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

export async function getLatestIncrementalActivitySyncRunForUser(
  userId: string,
) {
  const [syncRun] = await db
    .select({
      id: syncRuns.id,
      startedAt: syncRuns.startedAt,
    })
    .from(syncRuns)
    .where(
      and(eq(syncRuns.userId, userId), eq(syncRuns.syncType, "incremental")),
    )
    .orderBy(desc(syncRuns.startedAt))
    .limit(1);

  return syncRun ?? null;
}
