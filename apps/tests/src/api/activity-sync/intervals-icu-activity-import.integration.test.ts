import { ActivityImportWriterLive } from "@korex/api/modules/activity-sync/activity-sync.live";
import { storeIntervalsIcuActivityImport } from "@korex/api/modules/activity-sync/providers/intervals-icu/intervals-icu-activity-import";
import {
  linkExternalActivityToActivity,
  upsertExternalActivity,
} from "@korex/api/modules/activity-sync/repositories/external-activities.repository";
import { createActivitySyncRun } from "@korex/api/modules/activity-sync/repositories/sync-runs.repository";
import { activities, db, externalActivities } from "@korex/db";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { ExternalActivityBuilder } from "../../setup/integration/test-data/external-activity-builder";
import { IntervalsIcuActivityDetailBuilder } from "../../setup/integration/test-data/intervals-icu-activity-detail-builder";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("Intervals.icu activity import integration", () => {
  it("unlinks and deletes an existing core activity when the provider activity becomes unsupported", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    await DataSeedAsync.withActivities(activity).seedAsync();
    const firstSyncRun = await createActivitySyncRun({
      provider: "intervals_icu",
      syncType: "manual",
      userId: userDataExtensions.HughJass.id,
    });
    const externalActivity = await upsertExternalActivity(
      ExternalActivityBuilder.init(
        firstSyncRun.id,
        userDataExtensions.HughJass.id,
      ).build(),
    );
    await linkExternalActivityToActivity({
      activityId: activity.id,
      externalActivityId: externalActivity.externalActivityId,
    });
    const secondSyncRun = await createActivitySyncRun({
      provider: "intervals_icu",
      syncType: "manual",
      userId: userDataExtensions.HughJass.id,
    });

    const result = await Effect.runPromise(
      storeIntervalsIcuActivityImport({
        detail: IntervalsIcuActivityDetailBuilder.init()
          .withType("Ride")
          .build(),
        errors: [],
        lastSyncRunId: secondSyncRun.id,
        providerAthleteId: "athlete-1",
        userId: userDataExtensions.HughJass.id,
      }).pipe(Effect.provide(ActivityImportWriterLive)),
    );

    const [storedExternalActivity] = await db
      .select()
      .from(externalActivities)
      .where(eq(externalActivities.id, externalActivity.externalActivityId));
    const [storedActivity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activity.id));

    expect(result).toEqual({
      externalActivityId: externalActivity.externalActivityId,
      skipped: true,
    });
    expect(storedExternalActivity).toMatchObject({
      activityId: null,
      lastSyncRunId: secondSyncRun.id,
      sportType: "Ride",
    });
    expect(storedActivity).toBeUndefined();
  });

  it("updates an existing external activity and linked core activity when provider detail changes", async () => {
    const firstSyncRun = await createActivitySyncRun({
      provider: "intervals_icu",
      syncType: "manual",
      userId: userDataExtensions.HughJass.id,
    });
    const firstResult = await Effect.runPromise(
      storeIntervalsIcuActivityImport({
        detail: IntervalsIcuActivityDetailBuilder.init().build(),
        errors: [],
        lastSyncRunId: firstSyncRun.id,
        providerAthleteId: "athlete-1",
        userId: userDataExtensions.HughJass.id,
      }).pipe(Effect.provide(ActivityImportWriterLive)),
    );

    if (firstResult.skipped) {
      throw new Error("Expected initial import to create an activity");
    }

    const secondSyncRun = await createActivitySyncRun({
      provider: "intervals_icu",
      syncType: "manual",
      userId: userDataExtensions.HughJass.id,
    });
    const secondResult = await Effect.runPromise(
      storeIntervalsIcuActivityImport({
        detail: IntervalsIcuActivityDetailBuilder.init()
          .withName("Evening Run")
          .build(),
        errors: [],
        lastSyncRunId: secondSyncRun.id,
        providerAthleteId: "athlete-1",
        userId: userDataExtensions.HughJass.id,
      }).pipe(Effect.provide(ActivityImportWriterLive)),
    );

    if (secondResult.skipped) {
      throw new Error("Expected updated import to update an activity");
    }

    const [storedExternalActivity] = await db
      .select()
      .from(externalActivities)
      .where(eq(externalActivities.id, firstResult.externalActivityId));
    const [storedActivity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, firstResult.activityId));

    expect(secondResult).toMatchObject({
      activityId: firstResult.activityId,
      created: false,
      externalActivityId: firstResult.externalActivityId,
      providerActivityId: "activity-1",
      skipped: false,
      updated: true,
    });
    expect(storedExternalActivity).toMatchObject({
      activityId: firstResult.activityId,
      lastSyncRunId: secondSyncRun.id,
      rawData: expect.objectContaining({
        name: "Evening Run",
      }),
    });
    expect(storedActivity).toMatchObject({
      id: firstResult.activityId,
      name: "Evening Run",
    });
  });
});
