import { ActivitySyncLive } from "@korex/api/modules/activity-sync/activity-sync.live";
import { fetchIntervalsIcuActivities } from "@korex/api/modules/activity-sync/activity-sync.service";
import { encryptProviderSecret } from "@korex/api/modules/provider-connections/provider-secret-encryption";
import {
  db,
  externalActivities,
  externalActivityMaps,
  externalActivityStreams,
  syncRuns,
} from "@korex/db";
import { IntervalsIcuClientLayer } from "@korex/integrations/intervals-icu/live";
import { Effect, Layer } from "effect";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { intervalsIcuActivityHttpClientSuccess } from "../../mocks/integrations/intervals-icu/activity-http-client";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { ProviderConnectionBuilder } from "../../setup/integration/test-data/provider-connection-builder";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity sync integration", () => {
  it("syncs one Intervals.icu activity into persisted sync, activity, map, and stream rows", async () => {
    const encryptedApiKey = await Effect.runPromise(
      encryptProviderSecret("intervals-api-key"),
    );
    await DataSeedAsync.withProviderConnections(
      ProviderConnectionBuilder.initWithUser(userDataExtensions.HughJass.id)
        .withAuthSecretEncrypted(encryptedApiKey)
        .withProviderUserId("athlete-1")
        .build(),
    ).seedAsync();

    const result = await Effect.runPromise(
      fetchIntervalsIcuActivities({
        endDate: new Date("2026-04-02T00:00:00.000Z"),
        startDate: new Date("2026-04-01T00:00:00.000Z"),
        userId: userDataExtensions.HughJass.id,
      }).pipe(Effect.provide(activitySyncIntegrationLayer)),
    );

    expect(result).toMatchObject({
      activitiesCreated: 1,
      activitiesSeen: 1,
      activitiesStored: 1,
      activitiesUpdated: 0,
      errors: [],
      status: "success",
      syncRunId: expect.any(Number),
    });

    const [syncRun] = await db
      .select()
      .from(syncRuns)
      .where(eq(syncRuns.id, result.syncRunId));

    if (!syncRun) {
      throw new Error("Expected activity sync run to be persisted");
    }

    expect(syncRun).toMatchObject({
      activitiesCreated: 1,
      activitiesSeen: 1,
      activitiesUpdated: 0,
      errorCode: null,
      errorMessage: null,
      id: result.syncRunId,
      metadata: { errors: [] },
      provider: "intervals_icu",
      status: "success",
      syncType: "manual",
      userId: userDataExtensions.HughJass.id,
    });
    expect(syncRun.finishedAt).toBeInstanceOf(Date);

    const [activity] = await db
      .select()
      .from(externalActivities)
      .where(eq(externalActivities.providerActivityId, "activity-1"));

    if (!activity) {
      throw new Error("Expected external activity to be persisted");
    }

    expect(activity).toMatchObject({
      lastSyncRunId: result.syncRunId,
      provider: "intervals_icu",
      providerActivityId: "activity-1",
      providerAthleteId: "athlete-1",
      rawData: expect.objectContaining({
        id: "activity-1",
        name: "Run",
      }),
      sportType: "Run",
      userId: userDataExtensions.HughJass.id,
    });

    const [map] = await db
      .select()
      .from(externalActivityMaps)
      .where(eq(externalActivityMaps.externalActivityId, activity.id));

    expect(map).toMatchObject({
      lastSyncRunId: result.syncRunId,
      provider: "intervals_icu",
      providerActivityId: "activity-1",
      rawData: { polyline: "abc123" },
      userId: userDataExtensions.HughJass.id,
    });

    const streams = await db
      .select()
      .from(externalActivityStreams)
      .where(eq(externalActivityStreams.externalActivityId, activity.id));

    expect(streams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lastSyncRunId: result.syncRunId,
          rawData: [140, 142],
          streamType: "hr",
        }),
        expect.objectContaining({
          lastSyncRunId: result.syncRunId,
          rawData: [0, 1],
          streamType: "time",
        }),
      ]),
    );
    expect(streams).toHaveLength(2);
  });
});

const activitySyncIntegrationLayer = Layer.mergeAll(
  ActivitySyncLive,
  IntervalsIcuClientLayer.pipe(
    Layer.provide(intervalsIcuActivityHttpClientSuccess),
  ),
);
