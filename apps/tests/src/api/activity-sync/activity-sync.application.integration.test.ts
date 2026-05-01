import { executeInitialSync } from "@korex/api/modules/activity-sync/activity-sync.application";
import {
  createActivitySyncRun,
  finishActivitySyncRun,
} from "@korex/api/modules/activity-sync/repositories/sync-runs.repository";
import { describe, expect, it } from "vitest";
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
});
