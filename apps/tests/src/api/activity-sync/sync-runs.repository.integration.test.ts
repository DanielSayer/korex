import {
  createActivitySyncRun,
  finishActivitySyncRun,
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
});
