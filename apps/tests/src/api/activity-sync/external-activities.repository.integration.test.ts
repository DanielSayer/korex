import {
  replaceActivityMap,
  replaceActivityStreams,
  upsertActivity,
} from "@korex/api/modules/activities/activities.repository";
import {
  upsertExternalActivity,
  upsertExternalActivityMap,
  upsertExternalActivityStream,
} from "@korex/api/modules/activity-sync/repositories/external-activities.repository";
import { createActivitySyncRun } from "@korex/api/modules/activity-sync/repositories/sync-runs.repository";
import {
  activityMaps,
  activityStreams,
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
      activityId: null,
      created: true,
      externalActivityId: expect.any(Number),
      updated: false,
    });
    expect(unchanged).toEqual({
      activityId: null,
      created: false,
      externalActivityId: created.externalActivityId,
      updated: false,
    });
    expect(changed).toEqual({
      activityId: null,
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
        eq(
          externalActivityMaps.externalActivityId,
          activity.externalActivityId,
        ),
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

  it("replaces an Activity Map by activity id", async () => {
    const activity = await upsertActivity({
      activityId: null,
      input: {
        averageCadenceStepsPerMinute: null,
        averageHeartRateBeatsPerMinute: null,
        averageSpeedMetersPerSecond: null,
        deviceName: null,
        distanceMeters: null,
        elapsedTimeSeconds: null,
        energyKilocalories: null,
        maxHeartRateBeatsPerMinute: null,
        maxSpeedMetersPerSecond: null,
        movingTimeSeconds: null,
        name: "Morning Run",
        sportType: "run",
        startAt: new Date("2026-04-01T07:00:00.000Z"),
        totalElevationGainMeters: null,
        totalElevationLossMeters: null,
        userId: userDataExtensions.HughJass.id,
      },
    });

    await replaceActivityMap({
      activityId: activity.activityId,
      map: {
        bounds: null,
        coordinates: [{ latitude: -27.581491, longitude: 153.06828 }],
      },
    });
    await replaceActivityMap({
      activityId: activity.activityId,
      map: {
        bounds: {
          northEast: { latitude: -27.58015, longitude: 153.07713 },
          southWest: { latitude: -27.590372, longitude: 153.06575 },
        },
        coordinates: [
          { latitude: -27.581491, longitude: 153.06828 },
          { latitude: -27.581144, longitude: 153.06902 },
        ],
      },
    });

    const maps = await db
      .select()
      .from(activityMaps)
      .where(eq(activityMaps.activityId, activity.activityId));

    expect(maps).toHaveLength(1);
    expect(maps[0]).toMatchObject({
      activityId: activity.activityId,
      bounds: {
        northEast: { latitude: -27.58015, longitude: 153.07713 },
        southWest: { latitude: -27.590372, longitude: 153.06575 },
      },
      coordinates: [
        { latitude: -27.581491, longitude: 153.06828 },
        { latitude: -27.581144, longitude: 153.06902 },
      ],
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

  it("replaces core activity streams by activity id", async () => {
    const activity = await upsertActivity({
      activityId: null,
      input: {
        averageCadenceStepsPerMinute: null,
        averageHeartRateBeatsPerMinute: null,
        averageSpeedMetersPerSecond: null,
        deviceName: null,
        distanceMeters: null,
        elapsedTimeSeconds: null,
        energyKilocalories: null,
        maxHeartRateBeatsPerMinute: null,
        maxSpeedMetersPerSecond: null,
        movingTimeSeconds: null,
        name: "Morning Run",
        sportType: "run",
        startAt: new Date("2026-04-01T00:00:00.000Z"),
        totalElevationGainMeters: null,
        totalElevationLossMeters: null,
        userId: userDataExtensions.HughJass.id,
      },
    });

    await replaceActivityStreams({
      activityId: activity.activityId,
      streams: [
        {
          data: [164, 166],
          streamType: "cadence",
        },
        {
          data: [140, 142],
          streamType: "heartRate",
        },
      ],
    });

    await replaceActivityStreams({
      activityId: activity.activityId,
      streams: [
        {
          data: [0, 8.5],
          streamType: "distance",
        },
      ],
    });

    const streams = await db
      .select()
      .from(activityStreams)
      .where(eq(activityStreams.activityId, activity.activityId));

    expect(streams).toEqual([
      expect.objectContaining({
        activityId: activity.activityId,
        data: [0, 8.5],
        streamType: "distance",
      }),
    ]);
  });
});
