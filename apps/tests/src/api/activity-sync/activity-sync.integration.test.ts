import { ActivitySyncLive } from "@korex/api/modules/activity-sync/activity-sync.live";
import { fetchIntervalsIcuActivities } from "@korex/api/modules/activity-sync/activity-sync.service";
import { encryptProviderSecret } from "@korex/api/modules/provider-connections/provider-secret-encryption";
import {
  activities,
  activityHeartRateZoneSnapshots,
  activityHeartRateZoneTimeCalculationJobs,
  activityLaps,
  activityMaps,
  activityStreams,
  db,
  externalActivities,
  externalActivityMaps,
  externalActivityStreams,
  syncRuns,
} from "@korex/db";
import { IntervalsIcuClientLayer } from "@korex/integrations/intervals-icu/live";
import { asc, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { intervalsIcuActivityHttpClientSuccess } from "../../mocks/integrations/intervals-icu/activity-http-client";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { HeartRateZoneBuilder } from "../../setup/integration/test-data/heart-rate-zone-builder";
import { ProviderConnectionBuilder } from "../../setup/integration/test-data/provider-connection-builder";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity sync integration", () => {
  it("syncs one Intervals.icu activity into persisted sync, activity, map, and stream rows", async () => {
    const encryptedApiKey = await Effect.runPromise(
      encryptProviderSecret("intervals-api-key"),
    );
    const providerConnection = ProviderConnectionBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withAuthSecretEncrypted(encryptedApiKey)
      .withProviderUserId("athlete-1")
      .build();
    const easyZone = HeartRateZoneBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    const steadyZone = HeartRateZoneBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withId(1002)
      .withMaxBpm(160)
      .withMinBpm(140)
      .withName("Steady")
      .withPosition(2)
      .build();
    await DataSeedAsync.withProviderConnections(providerConnection)
      .withHeartRateZones(easyZone, steadyZone)
      .seedAsync();

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
      activityId: expect.any(Number),
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

    const [korexActivity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activity.activityId ?? 0));

    expect(korexActivity).toMatchObject({
      averageCadenceStepsPerMinute: 174,
      averageHeartRateBeatsPerMinute: 151,
      averageSpeedMetersPerSecond: 3.25,
      deviceName: "Garmin Forerunner",
      distanceMeters: 10001.5,
      elapsedTimeSeconds: 3900,
      energyKilocalories: 540,
      maxHeartRateBeatsPerMinute: 181,
      maxSpeedMetersPerSecond: 5.8,
      movingTimeSeconds: 3600,
      name: "Run",
      sportType: "run",
      startAt: new Date("2026-03-31T20:00:00.000Z"),
      totalElevationGainMeters: 123.4,
      totalElevationLossMeters: 120.2,
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
      rawData: {
        bounds: [
          [-27.590372, 153.06575],
          [-27.58015, 153.07713],
        ],
        latlngs: [
          [-27.581491, 153.06828],
          [-27.581144, 153.06902],
        ],
        route: null,
        weather: null,
      },
      userId: userDataExtensions.HughJass.id,
    });

    const [activityMap] = await db
      .select()
      .from(activityMaps)
      .where(eq(activityMaps.activityId, activity.activityId ?? 0));

    expect(activityMap).toMatchObject({
      activityId: activity.activityId,
      bounds: {
        northEast: {
          latitude: -27.58015,
          longitude: 153.07713,
        },
        southWest: {
          latitude: -27.590372,
          longitude: 153.06575,
        },
      },
      coordinates: [
        {
          latitude: -27.581491,
          longitude: 153.06828,
        },
        {
          latitude: -27.581144,
          longitude: 153.06902,
        },
      ],
    });

    const laps = await db
      .select()
      .from(activityLaps)
      .where(eq(activityLaps.activityId, activity.activityId ?? 0))
      .orderBy(asc(activityLaps.index));

    expect(laps).toEqual([
      expect.objectContaining({
        activityId: activity.activityId,
        averageCadenceStepsPerMinute: 174,
        averageHeartRateBeatsPerMinute: 151,
        averageSpeedMetersPerSecond: 3.25,
        averageStrideLengthMeters: 1.02,
        distanceMeters: 1000,
        elapsedTimeSeconds: 300,
        endTimeSeconds: 300,
        index: 0,
        maxHeartRateBeatsPerMinute: 181,
        maxSpeedMetersPerSecond: 5.8,
        movingTimeSeconds: 295,
        startTimeSeconds: 0,
        totalElevationGainMeters: 12.3,
      }),
      expect.objectContaining({
        activityId: activity.activityId,
        distanceMeters: 900,
        endTimeSeconds: 600,
        index: 1,
        startTimeSeconds: 300,
      }),
    ]);

    const streams = await db
      .select()
      .from(externalActivityStreams)
      .where(eq(externalActivityStreams.externalActivityId, activity.id));

    expect(streams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lastSyncRunId: result.syncRunId,
          rawData: expect.objectContaining({
            data: [82, 83],
            type: "cadence",
          }),
          streamType: "cadence",
        }),
        expect.objectContaining({
          lastSyncRunId: result.syncRunId,
          rawData: expect.objectContaining({
            data: [140, 142],
            type: "heartrate",
          }),
          streamType: "heartrate",
        }),
      ]),
    );
    expect(streams).toHaveLength(5);

    const coreStreams = await db
      .select()
      .from(activityStreams)
      .where(eq(activityStreams.activityId, activity.activityId ?? 0))
      .orderBy(asc(activityStreams.streamType));

    expect(coreStreams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          activityId: activity.activityId,
          data: [164, 166],
          streamType: "cadence",
        }),
        expect.objectContaining({
          activityId: activity.activityId,
          data: [140, 142],
          streamType: "heartRate",
        }),
      ]),
    );
    expect(coreStreams).toHaveLength(5);

    const snapshots = await db
      .select()
      .from(activityHeartRateZoneSnapshots)
      .where(
        eq(activityHeartRateZoneSnapshots.activityId, activity.activityId ?? 0),
      )
      .orderBy(asc(activityHeartRateZoneSnapshots.position));
    const [zoneTimeJob] = await db
      .select()
      .from(activityHeartRateZoneTimeCalculationJobs)
      .where(
        eq(
          activityHeartRateZoneTimeCalculationJobs.activityId,
          activity.activityId ?? 0,
        ),
      );

    expect(snapshots).toEqual([
      expect.objectContaining({
        activityId: activity.activityId,
        maxBpm: 140,
        minBpm: 120,
        name: "Easy",
        position: 1,
      }),
      expect.objectContaining({
        activityId: activity.activityId,
        maxBpm: 160,
        minBpm: 140,
        name: "Steady",
        position: 2,
      }),
    ]);
    expect(zoneTimeJob).toMatchObject({
      activityId: activity.activityId,
      attemptCount: 0,
      status: "pending",
    });
  });
});

const activitySyncIntegrationLayer = Layer.mergeAll(
  ActivitySyncLive,
  IntervalsIcuClientLayer.pipe(
    Layer.provide(intervalsIcuActivityHttpClientSuccess),
  ),
);
