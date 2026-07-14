import { enqueueActivitySyncRun } from "@korex/api/modules/activity-sync/activity-sync.live";
import {
  claimActivitySyncRun,
  createActivitySyncRun,
  createQueuedActivitySyncRun,
  finishActivitySyncRun,
  getActivitySyncRunForTask,
  getLatestIncrementalActivitySyncRunForUser,
  getLatestSuccessfulActivitySyncRunForUser,
  hasSuccessfulActivitySyncRunForUser,
  resetActivitySyncRunForRetry,
} from "@korex/api/modules/activity-sync/repositories/sync-runs.repository";
import { db, jobRuntimeJobs, syncRuns } from "@korex/db";
import { and, eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { SyncRunBuilder } from "../../setup/integration/test-data/sync-run-builder";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("sync runs repository", () => {
  it("creates the queued Sync Run and job atomically", async () => {
    await db.execute(sql`
      CREATE FUNCTION fail_activity_sync_job_insert()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'forced activity sync job insert failure';
      END;
      $$ LANGUAGE plpgsql
    `);
    await db.execute(sql`
      CREATE TRIGGER fail_activity_sync_job_insert
      BEFORE INSERT ON job_runtime_jobs
      FOR EACH ROW EXECUTE FUNCTION fail_activity_sync_job_insert()
    `);

    try {
      await expect(
        enqueueActivitySyncRun({
          provider: "intervals_icu",
          syncType: "initial",
          userId: userDataExtensions.HughJass.id,
        }),
      ).rejects.toThrow();
    } finally {
      await db.execute(sql`
        DROP TRIGGER fail_activity_sync_job_insert ON job_runtime_jobs
      `);
      await db.execute(sql`DROP FUNCTION fail_activity_sync_job_insert()`);
    }

    const queuedRuns = await db
      .select()
      .from(syncRuns)
      .where(
        and(
          eq(syncRuns.userId, userDataExtensions.HughJass.id),
          eq(syncRuns.status, "pending"),
        ),
      );
    const jobs = await db.select().from(jobRuntimeJobs);

    expect(queuedRuns).toEqual([]);
    expect(jobs).toEqual([]);
  });

  it("allows only one concurrent claim of a queued Sync Run", async () => {
    const queued = await createQueuedActivitySyncRun({
      provider: "intervals_icu",
      syncType: "initial",
      userId: userDataExtensions.HughJass.id,
    });

    const claims = await Promise.all([
      claimActivitySyncRun(queued.id),
      claimActivitySyncRun(queued.id),
    ]);

    expect(claims.sort()).toEqual([false, true]);
    await expect(getActivitySyncRunForTask(queued.id)).resolves.toMatchObject({
      id: queued.id,
      status: "running",
      syncType: "initial",
      userId: userDataExtensions.HughJass.id,
    });
  });

  it("makes a failed Sync Run claimable for retry", async () => {
    const queued = await createQueuedActivitySyncRun({
      provider: "intervals_icu",
      syncType: "initial",
      userId: userDataExtensions.HughJass.id,
    });
    await claimActivitySyncRun(queued.id);
    await finishActivitySyncRun({
      activitiesCreated: 0,
      activitiesSeen: 0,
      activitiesUpdated: 0,
      errorCode: "list",
      errorMessage: "temporary failure",
      status: "failed",
      syncRunId: queued.id,
    });

    await resetActivitySyncRunForRetry(queued.id);

    await expect(getActivitySyncRunForTask(queued.id)).resolves.toMatchObject({
      status: "pending",
    });
    await expect(claimActivitySyncRun(queued.id)).resolves.toBe(true);
  });

  it("creates and finishes an activity sync run", async () => {
    const created = await createActivitySyncRun({
      provider: "intervals_icu",
      syncType: "manual",
      userId: userDataExtensions.HughJass.id,
    });

    const [runningSyncRun] = await db
      .select()
      .from(syncRuns)
      .where(eq(syncRuns.id, created.id));

    expect(runningSyncRun).toMatchObject({
      id: created.id,
      provider: "intervals_icu",
      status: "running",
      syncType: "manual",
      userId: userDataExtensions.HughJass.id,
    });

    await finishActivitySyncRun({
      activitiesCreated: 1,
      activitiesSeen: 2,
      activitiesUpdated: 3,
      errorCode: "detail",
      errorMessage: "detail failed",
      metadata: {
        errors: [{ activityId: "activity-1", stage: "detail" }],
      },
      status: "partial",
      syncRunId: created.id,
    });

    const [finishedSyncRun] = await db
      .select()
      .from(syncRuns)
      .where(eq(syncRuns.id, created.id));

    expect(finishedSyncRun).toMatchObject({
      activitiesCreated: 1,
      activitiesSeen: 2,
      activitiesUpdated: 3,
      errorCode: "detail",
      errorMessage: "detail failed",
      metadata: {
        errors: [{ activityId: "activity-1", stage: "detail" }],
      },
      status: "partial",
    });
    expect(finishedSyncRun?.finishedAt).toBeInstanceOf(Date);
  });

  it("checks whether a user has any successful sync run", async () => {
    await DataSeedAsync.withSyncRuns(
      SyncRunBuilder.initWithUser(userDataExtensions.HughJass.id)
        .withStatus("partial")
        .build(),
    ).seedAsync();

    await expect(
      hasSuccessfulActivitySyncRunForUser(userDataExtensions.HughJass.id),
    ).resolves.toBe(false);

    await DataSeedAsync.withSyncRuns(
      SyncRunBuilder.initWithUser(userDataExtensions.HughJass.id)
        .withStatus("success")
        .build(),
    ).seedAsync();

    await expect(
      hasSuccessfulActivitySyncRunForUser(userDataExtensions.HughJass.id),
    ).resolves.toBe(true);
  });

  it("gets the latest successful sync run for a user", async () => {
    const latestSuccessfulSyncId = 9003;
    await DataSeedAsync.withSyncRuns(
      SyncRunBuilder.initWithUser(userDataExtensions.HughJass.id)
        .withId(9001)
        .withStartedAt(new Date("2026-04-01T00:00:00.000Z"))
        .withSyncType("initial")
        .build(),
      SyncRunBuilder.initWithUser(userDataExtensions.HughJass.id)
        .withId(9002)
        .withStartedAt(new Date("2026-04-03T00:00:00.000Z"))
        .withStatus("failed")
        .withSyncType("incremental")
        .build(),
      SyncRunBuilder.initWithUser(userDataExtensions.HughJass.id)
        .withId(latestSuccessfulSyncId)
        .withStartedAt(new Date("2026-04-02T00:00:00.000Z"))
        .withSyncType("incremental")
        .build(),
    ).seedAsync();

    await expect(
      getLatestSuccessfulActivitySyncRunForUser(userDataExtensions.HughJass.id),
    ).resolves.toMatchObject({
      id: latestSuccessfulSyncId,
      startedAt: new Date("2026-04-02T00:00:00.000Z"),
    });
  });

  it("gets the latest incremental sync run for a user", async () => {
    const latestIncrementalSyncId = 9012;
    await DataSeedAsync.withSyncRuns(
      SyncRunBuilder.initWithUser(userDataExtensions.HughJass.id)
        .withId(9010)
        .withStartedAt(new Date("2026-04-03T00:00:00.000Z"))
        .withSyncType("manual")
        .build(),
      SyncRunBuilder.initWithUser(userDataExtensions.HughJass.id)
        .withId(9011)
        .withStartedAt(new Date("2026-04-01T00:00:00.000Z"))
        .withSyncType("incremental")
        .build(),
      SyncRunBuilder.initWithUser(userDataExtensions.HughJass.id)
        .withId(latestIncrementalSyncId)
        .withStartedAt(new Date("2026-04-02T00:00:00.000Z"))
        .withStatus("failed")
        .withSyncType("incremental")
        .build(),
    ).seedAsync();

    await expect(
      getLatestIncrementalActivitySyncRunForUser(
        userDataExtensions.HughJass.id,
      ),
    ).resolves.toMatchObject({
      id: latestIncrementalSyncId,
      startedAt: new Date("2026-04-02T00:00:00.000Z"),
    });
  });
});
