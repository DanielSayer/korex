import { ActivityImportWriter } from "@korex/api/modules/activity-sync/activity-sync.dependencies";
import type { ActivitySyncFailure } from "@korex/api/modules/activity-sync/activity-sync.types";
import { syncIntervalsIcuActivity } from "@korex/api/modules/activity-sync/providers/intervals-icu/intervals-icu-sync";
import type {
  IntervalsIcuActivityMap,
  IntervalsIcuActivityStreams,
  IntervalsIcuClientService,
} from "@korex/integrations/intervals-icu/client";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { IntervalsIcuActivityDetailBuilder } from "../../../setup/integration/test-data/intervals-icu-activity-detail-builder";
import { InMemoryActivityArtifactStore } from "../../../setup/unit/activity-sync/in-memory-activity-artifact-store";

describe("syncIntervalsIcuActivity", () => {
  it("stores raw external artifacts before translated core artifacts", async () => {
    const artifactStore = new InMemoryActivityArtifactStore();
    const counters = createCounters();
    const errors: ActivitySyncFailure[] = [];

    await Effect.runPromise(
      syncIntervalsIcuActivity({
        activityId: "activity-1",
        apiKey: "api-key",
        athleteId: "athlete-1",
        client: createClient({
          map: {
            bounds: [
              [-27.590372, 153.06575],
              [-27.58015, 153.07713],
            ],
            latlngs: [
              [-27.581491, 153.06828],
              [-27.581144, 153.06902],
            ],
          },
          streams: {
            cadence: {
              data: [82, 83],
              type: "cadence",
            },
            heartrate: {
              data: [140, 142],
              type: "heartrate",
            },
          },
        }),
        counters,
        errors,
        syncRunId: 123,
        userId: "user-1",
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            artifactStore.layer,
            Layer.succeed(ActivityImportWriter, {
              storeExternalActivity: async () => ({
                activityId: null,
                created: true,
                externalActivityId: 10,
                updated: false,
              }),
              storeCoreActivity: async () => ({
                activityId: 20,
                created: true,
              }),
              unlinkUnsupportedActivity: async () => {},
            }),
          ),
        ),
      ),
    );

    expect(errors).toEqual([]);
    expect(counters).toMatchObject({
      activitiesCreated: 1,
      activitiesStored: 1,
      activitiesUpdated: 0,
    });
    expect(artifactStore.externalMaps.get(10)).toMatchObject({
      lastSyncRunId: 123,
      providerActivityId: "activity-1",
      userId: "user-1",
    });
    expect(artifactStore.coreMaps.get(20)).toMatchObject({
      coordinates: [
        { latitude: -27.581491, longitude: 153.06828 },
        { latitude: -27.581144, longitude: 153.06902 },
      ],
    });
    expect([...artifactStore.externalStreams.values()]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          streamType: "cadence",
        }),
        expect.objectContaining({
          streamType: "heartrate",
        }),
      ]),
    );
    expect(artifactStore.coreStreams.get(20)).toEqual(
      expect.arrayContaining([
        {
          data: [164, 166],
          streamType: "cadence",
        },
        {
          data: [140, 142],
          streamType: "heartRate",
        },
      ]),
    );
    expect(artifactStore.queuedActivityIds).toEqual([20]);
  });

  it("keeps raw external map data and skips core map storage when coordinates are empty", async () => {
    const artifactStore = new InMemoryActivityArtifactStore();
    const errors: ActivitySyncFailure[] = [];

    await Effect.runPromise(
      syncIntervalsIcuActivity({
        activityId: "activity-1",
        apiKey: "api-key",
        athleteId: "athlete-1",
        client: createClient({
          map: {
            latlngs: [],
          },
          streams: null,
        }),
        counters: createCounters(),
        errors,
        syncRunId: 123,
        userId: "user-1",
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            artifactStore.layer,
            Layer.succeed(ActivityImportWriter, {
              storeExternalActivity: async () => ({
                activityId: null,
                created: true,
                externalActivityId: 10,
                updated: false,
              }),
              storeCoreActivity: async () => ({
                activityId: 20,
                created: true,
              }),
              unlinkUnsupportedActivity: async () => {},
            }),
          ),
        ),
      ),
    );

    expect(artifactStore.externalMaps.get(10)).toMatchObject({
      rawData: {
        latlngs: [],
      },
    });
    expect(artifactStore.coreMaps.has(20)).toBe(false);
    expect(errors).toEqual([]);
  });
});

function createClient({
  map,
  streams,
}: {
  map: IntervalsIcuActivityMap | null;
  streams: IntervalsIcuActivityStreams | null;
}): IntervalsIcuClientService {
  return {
    getActivityDetail: () =>
      Effect.succeed(IntervalsIcuActivityDetailBuilder.init().build()),
    getActivityMap: () => Effect.succeed(map),
    getActivityStreams: () => Effect.succeed(streams),
    getAthleteProfile: () => Effect.die("unused"),
    listActivities: () => Effect.die("unused"),
  } as IntervalsIcuClientService;
}

function createCounters() {
  return {
    activitiesCreated: 0,
    activitiesSeen: 1,
    activitiesStored: 0,
    activitiesUpdated: 0,
  };
}
