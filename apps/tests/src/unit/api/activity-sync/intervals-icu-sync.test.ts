import type { ActivityImportWriterService } from "@korex/api/modules/activity-sync/activity-sync.dependencies";
import type { ActivitySyncFailure } from "@korex/api/modules/activity-sync/activity-sync.types";
import { syncIntervalsIcuActivity } from "@korex/api/modules/activity-sync/providers/intervals-icu/intervals-icu-sync";
import {
  type IntervalsIcuActivityMap,
  type IntervalsIcuActivityStreams,
  IntervalsIcuClientError,
  type IntervalsIcuClientService,
} from "@korex/integrations/intervals-icu/client";
import { describe, expect, it } from "vitest";
import { IntervalsIcuActivityDetailBuilder } from "../../../setup/integration/test-data/intervals-icu-activity-detail-builder";
import { InMemoryActivityArtifactStore } from "../../../setup/unit/activity-sync/in-memory-activity-artifact-store";

describe("syncIntervalsIcuActivity", () => {
  it("stores raw external artifacts before translated core artifacts", async () => {
    const artifactStore = new InMemoryActivityArtifactStore();
    const counters = createCounters();
    const errors: ActivitySyncFailure[] = [];

    await runActivitySync({
      artifactStore,
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
    });

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
    expect(artifactStore.operations).toEqual([
      "external:map",
      "core:map",
      "external:stream:cadence",
      "external:stream:heartrate",
      "core:streams",
    ]);
  });

  it("keeps raw external map data and skips core map storage when coordinates are empty", async () => {
    const artifactStore = new InMemoryActivityArtifactStore();
    const errors: ActivitySyncFailure[] = [];

    await runActivitySync({
      artifactStore,
      client: createClient({
        map: {
          latlngs: [],
        },
        streams: null,
      }),
      errors,
    });

    expect(artifactStore.externalMaps.get(10)).toMatchObject({
      rawData: {
        latlngs: [],
      },
    });
    expect(artifactStore.coreMaps.has(20)).toBe(false);
    expect(errors).toEqual([]);
  });

  it("records artifact request failures without discarding the core activity", async () => {
    const artifactStore = new InMemoryActivityArtifactStore();
    const counters = createCounters();
    const errors: ActivitySyncFailure[] = [];
    const client = {
      ...createClient({ map: null, streams: null }),
      getActivityMap: async () => {
        throw new IntervalsIcuClientError({
          message: "Map request failed",
          requestUrl: "https://intervals.icu/api/v1/activity/activity-1/map",
          status: 502,
        });
      },
      getActivityStreams: async () => {
        throw new IntervalsIcuClientError({
          message: "Streams request failed",
          requestUrl:
            "https://intervals.icu/api/v1/activity/activity-1/streams.json",
          status: 502,
        });
      },
    } satisfies IntervalsIcuClientService;

    await runActivitySync({ artifactStore, client, counters, errors });

    expect(counters).toMatchObject({
      activitiesCreated: 1,
      activitiesStored: 1,
    });
    expect(errors).toEqual([
      expect.objectContaining({
        activityId: "activity-1",
        message: "Map request failed",
        requestUrl: "https://intervals.icu/api/v1/activity/activity-1/map",
        stage: "map",
      }),
      expect.objectContaining({
        activityId: "activity-1",
        message: "Streams request failed",
        requestUrl:
          "https://intervals.icu/api/v1/activity/activity-1/streams.json",
        stage: "streams",
      }),
    ]);
  });

  it("keeps invalid provider streams for diagnosis without replacing core streams", async () => {
    const artifactStore = new InMemoryActivityArtifactStore();
    const errors: ActivitySyncFailure[] = [];

    await runActivitySync({
      artifactStore,
      client: createClient({
        map: null,
        streams: {
          heartrate: {
            data: null,
            type: "heartrate",
          },
        },
      }),
      errors,
    });

    expect(artifactStore.externalStreams.get("10:heartrate")).toMatchObject({
      rawData: {
        data: null,
        type: "heartrate",
      },
    });
    expect(artifactStore.coreStreams.has(20)).toBe(false);
    expect(errors).toEqual([
      expect.objectContaining({
        activityId: "activity-1",
        details: expect.objectContaining({
          field: "data",
          streamKey: "heartrate",
        }),
        requestUrl:
          "https://intervals.icu/api/v1/activity/activity-1/streams.json",
        stage: "streams",
      }),
    ]);
  });

  it.each([
    "map",
    "streams",
  ] as const)("preserves an existing core %s when its provider payload is missing", async (missingArtifact) => {
    const artifactStore = new InMemoryActivityArtifactStore();
    const existingMap = {
      bounds: null,
      coordinates: [{ latitude: -27.58, longitude: 153.07 }],
    };
    const existingStreams = [
      { data: [135, 140], streamType: "heartRate" as const },
    ];
    artifactStore.coreMaps.set(20, existingMap);
    artifactStore.coreStreams.set(20, existingStreams);

    await runActivitySync({
      artifactStore,
      client: createClient({
        map: missingArtifact === "map" ? null : { latlngs: [[-27.59, 153.08]] },
        streams:
          missingArtifact === "streams"
            ? null
            : { heartrate: { data: [145], type: "heartrate" } },
      }),
      errors: [],
    });

    if (missingArtifact === "map") {
      expect(artifactStore.coreMaps.get(20)).toBe(existingMap);
      expect(artifactStore.operations).not.toContain("core:map");
    } else {
      expect(artifactStore.coreStreams.get(20)).toBe(existingStreams);
      expect(artifactStore.operations).not.toContain("core:streams");
    }
  });

  it("keeps a malformed provider map for diagnosis without replacing the Activity Map", async () => {
    const artifactStore = new InMemoryActivityArtifactStore();
    const existingMap = {
      bounds: null,
      coordinates: [{ latitude: -27.58, longitude: 153.07 }],
    };
    const errors: ActivitySyncFailure[] = [];
    artifactStore.coreMaps.set(20, existingMap);

    await runActivitySync({
      artifactStore,
      client: createClient({
        map: { latlngs: [[-91, 153.08]] },
        streams: null,
      }),
      errors,
    });

    expect(artifactStore.externalMaps.get(10)).toMatchObject({
      rawData: { latlngs: [[-91, 153.08]] },
    });
    expect(artifactStore.coreMaps.get(20)).toBe(existingMap);
    expect(artifactStore.operations).toEqual(["external:map"]);
    expect(errors).toEqual([
      expect.objectContaining({
        activityId: "activity-1",
        requestUrl: "https://intervals.icu/api/v1/activity/activity-1/map",
        stage: "map",
      }),
    ]);
  });

  it("propagates aborts instead of recording an artifact failure", async () => {
    const artifactStore = new InMemoryActivityArtifactStore();
    const controller = new AbortController();
    const errors: ActivitySyncFailure[] = [];
    controller.abort();
    const client = {
      ...createClient({ map: null, streams: null }),
      getActivityMap: async () => {
        throw new Error("request aborted");
      },
    } satisfies IntervalsIcuClientService;

    await expect(
      runActivitySync({
        artifactStore,
        client,
        errors,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(errors).toEqual([]);
  });

  it.each([
    [
      "external map",
      "storeExternalMap",
      "Failed to store external activity map",
    ],
    ["core map", "replaceCoreMap", "Failed to store activity map"],
    [
      "external stream",
      "storeExternalStream",
      "Failed to store external activity stream",
    ],
    [
      "core streams",
      "replaceCoreStreamsAndQueueCalculation",
      "Failed to store activity streams",
    ],
  ] as const)("treats %s persistence failures as fatal", async (_label, method, message) => {
    const artifactStore = new InMemoryActivityArtifactStore();
    artifactStore.adapter[method] = async () => {
      throw new Error("database unavailable");
    };

    await expect(
      runActivitySync({
        artifactStore,
        client: createClient({
          map: method.includes("Map") ? { latlngs: [[-27.59, 153.08]] } : null,
          streams: method.includes("Stream")
            ? { heartrate: { data: [145], type: "heartrate" } }
            : null,
        }),
        errors: [],
      }),
    ).rejects.toMatchObject({
      message,
      name: "ActivitySyncError",
    });
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
    getActivityDetail: async () =>
      IntervalsIcuActivityDetailBuilder.init().build(),
    getActivityMap: async () => map,
    getActivityStreams: async () => streams,
    getAthleteProfile: async () => {
      throw new Error("unused");
    },
    listActivities: async () => {
      throw new Error("unused");
    },
  };
}

function createCounters() {
  return {
    activitiesCreated: 0,
    activitiesSeen: 1,
    activitiesStored: 0,
    activitiesUpdated: 0,
  };
}

function runActivitySync({
  artifactStore,
  client,
  counters = createCounters(),
  errors,
  signal,
}: {
  artifactStore: InMemoryActivityArtifactStore;
  client: IntervalsIcuClientService;
  counters?: ReturnType<typeof createCounters>;
  errors: ActivitySyncFailure[];
  signal?: AbortSignal;
}) {
  const writer: ActivityImportWriterService = {
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
  };
  return syncIntervalsIcuActivity({
    activityId: "activity-1",
    artifactStore: artifactStore.adapter,
    apiKey: "api-key",
    athleteId: "athlete-1",
    client,
    counters,
    errors,
    signal,
    syncRunId: 123,
    userId: "user-1",
    writer,
  });
}
