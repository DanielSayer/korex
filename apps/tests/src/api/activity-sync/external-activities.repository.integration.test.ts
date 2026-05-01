import {
  upsertExternalActivity,
  upsertExternalActivityMap,
  upsertExternalActivityStream,
} from "@korex/api/modules/activity-sync/repositories/external-activities.repository";
import { createActivitySyncRun } from "@korex/api/modules/activity-sync/repositories/sync-runs.repository";
import {
  db,
  externalActivities,
  externalActivityMaps,
  externalActivityStreams,
} from "@korex/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ExternalActivityBuilder } from "../../setup/integration/test-data/external-activity-builder";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("external activities repository", () => {
  it("creates and updates an external activity by user, provider, and provider activity id", async () => {
    const syncRun = await createActivitySyncRun({
      provider: "intervals_icu",
      syncType: "manual",
      userId: userDataExtensions.HughJass.id,
    });
    const input = ExternalActivityBuilder.init(
      syncRun.id,
      userDataExtensions.HughJass.id,
    )
      .withRawData({ id: "activity-1", name: "Morning Run" })
      .build();

    const created = await upsertExternalActivity(input);
    const unchanged = await upsertExternalActivity(input);
    const changed = await upsertExternalActivity(
      ExternalActivityBuilder.init(syncRun.id, userDataExtensions.HughJass.id)
        .withRawData({ id: "activity-1", name: "Morning Run Updated" })
        .withSportType("TrailRun")
        .build(),
    );

    expect(created).toEqual({
      created: true,
      externalActivityId: expect.any(Number),
      updated: false,
    });
    expect(unchanged).toEqual({
      created: false,
      externalActivityId: created.externalActivityId,
      updated: false,
    });
    expect(changed).toEqual({
      created: false,
      externalActivityId: created.externalActivityId,
      updated: true,
    });

    const activities = await db
      .select()
      .from(externalActivities)
      .where(eq(externalActivities.providerActivityId, "activity-1"));

    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      id: created.externalActivityId,
      lastSyncRunId: syncRun.id,
      provider: "intervals_icu",
      providerActivityId: "activity-1",
      rawData: { id: "activity-1", name: "Morning Run Updated" },
      sportType: "TrailRun",
      userId: userDataExtensions.HughJass.id,
    });
  });

  it("upserts an activity map by external activity id", async () => {
    const syncRun = await createActivitySyncRun({
      provider: "intervals_icu",
      syncType: "manual",
      userId: userDataExtensions.HughJass.id,
    });
    const activity = await upsertExternalActivity(
      ExternalActivityBuilder.init(
        syncRun.id,
        userDataExtensions.HughJass.id,
      ).build(),
    );

    await upsertExternalActivityMap({
      externalActivityId: activity.externalActivityId,
      lastSyncRunId: syncRun.id,
      provider: "intervals_icu",
      providerActivityId: "activity-1",
      rawData: { polyline: "abc123" },
      userId: userDataExtensions.HughJass.id,
    });
    await upsertExternalActivityMap({
      externalActivityId: activity.externalActivityId,
      lastSyncRunId: syncRun.id,
      provider: "intervals_icu",
      providerActivityId: "activity-1",
      rawData: { polyline: "updated" },
      userId: userDataExtensions.HughJass.id,
    });

    const maps = await db
      .select()
      .from(externalActivityMaps)
      .where(
        eq(externalActivityMaps.externalActivityId, activity.externalActivityId),
      );

    expect(maps).toHaveLength(1);
    expect(maps[0]).toMatchObject({
      externalActivityId: activity.externalActivityId,
      lastSyncRunId: syncRun.id,
      provider: "intervals_icu",
      providerActivityId: "activity-1",
      rawData: { polyline: "updated" },
      userId: userDataExtensions.HughJass.id,
    });
  });

  it("upserts activity streams by external activity id and stream type", async () => {
    const syncRun = await createActivitySyncRun({
      provider: "intervals_icu",
      syncType: "manual",
      userId: userDataExtensions.HughJass.id,
    });
    const activity = await upsertExternalActivity(
      ExternalActivityBuilder.init(
        syncRun.id,
        userDataExtensions.HughJass.id,
      ).build(),
    );

    await upsertExternalActivityStream({
      externalActivityId: activity.externalActivityId,
      lastSyncRunId: syncRun.id,
      provider: "intervals_icu",
      providerActivityId: "activity-1",
      rawData: [140, 142],
      streamType: "hr",
      userId: userDataExtensions.HughJass.id,
    });
    await upsertExternalActivityStream({
      externalActivityId: activity.externalActivityId,
      lastSyncRunId: syncRun.id,
      provider: "intervals_icu",
      providerActivityId: "activity-1",
      rawData: [141, 143],
      streamType: "hr",
      userId: userDataExtensions.HughJass.id,
    });
    await upsertExternalActivityStream({
      externalActivityId: activity.externalActivityId,
      lastSyncRunId: syncRun.id,
      provider: "intervals_icu",
      providerActivityId: "activity-1",
      rawData: [0, 1],
      streamType: "time",
      userId: userDataExtensions.HughJass.id,
    });

    const streams = await db
      .select()
      .from(externalActivityStreams)
      .where(
        eq(
          externalActivityStreams.externalActivityId,
          activity.externalActivityId,
        ),
      );

    expect(streams).toHaveLength(2);
    expect(streams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rawData: [141, 143],
          streamType: "hr",
        }),
        expect.objectContaining({
          rawData: [0, 1],
          streamType: "time",
        }),
      ]),
    );
  });
});
