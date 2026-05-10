import {
  createActivitySyncRun,
  finishActivitySyncRun,
  getLatestIncrementalActivitySyncRunForUser,
  getLatestSuccessfulActivitySyncRunForUser,
  hasSuccessfulActivitySyncRunForUser,
} from "@korex/api/modules/activity-sync/repositories/sync-runs.repository";
import { db, syncRuns } from "@korex/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { SyncRunBuilder } from "../../setup/integration/test-data/sync-run-builder";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("sync runs repository", () => {
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
