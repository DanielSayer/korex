import {
  executeIncrementalSync,
  executeInitialSync,
} from "@korex/api/modules/activity-sync/activity-sync.application";
import {
  createActivitySyncRun,
  finishActivitySyncRun,
} from "@korex/api/modules/activity-sync/repositories/sync-runs.repository";
import { describe, expect, it } from "vitest";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { SyncRunBuilder } from "../../setup/integration/test-data/sync-run-builder";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity sync application", () => {
  it("fails initial sync before provider dispatch when the user has a successful sync", async () => {
    const created = await createActivitySyncRun({
      provider: "intervals_icu",
      syncType: "manual",
      userId: userDataExtensions.HughJass.id,
    });

    await finishActivitySyncRun({
      activitiesCreated: 1,
      activitiesSeen: 1,
      activitiesUpdated: 0,
      status: "success",
      syncRunId: created.id,
    });

    await expect(
      executeInitialSync(userDataExtensions.HughJass.id),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("fails incremental sync before provider dispatch when the user has no successful sync", async () => {
    await expect(
      executeIncrementalSync(userDataExtensions.HughJass.id),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rate limits incremental sync before provider dispatch when the user synced recently", async () => {
    await DataSeedAsync.withSyncRuns(
      SyncRunBuilder.initWithUser(userDataExtensions.HughJass.id)
        .withId(9020)
        .withStartedAt(new Date("2026-04-01T00:00:00.000Z"))
        .withSyncType("initial")
        .build(),
    ).seedAsync();

    const created = await createActivitySyncRun({
      provider: "intervals_icu",
      syncType: "incremental",
      userId: userDataExtensions.HughJass.id,
    });

    await finishActivitySyncRun({
      activitiesCreated: 0,
      activitiesSeen: 1,
      activitiesUpdated: 0,
      status: "failed",
      syncRunId: created.id,
    });

    await expect(
      executeIncrementalSync(userDataExtensions.HughJass.id),
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      message: expect.stringContaining("about"),
    });
  });
});
