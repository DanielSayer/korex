import type {
  ActivityInput,
  ActivityLapInput,
} from "@korex/api/modules/activities/activities.types";
import type { ActivityImportWriterService } from "@korex/api/modules/activity-sync/activity-sync.dependencies";
import type { ActivitySyncFailure } from "@korex/api/modules/activity-sync/activity-sync.types";
import { storeIntervalsIcuActivityImport } from "@korex/api/modules/activity-sync/providers/intervals-icu/intervals-icu-activity-import";
import type {
  UpsertExternalActivityInput,
  UpsertExternalActivityResult,
} from "@korex/api/modules/activity-sync/repositories/external-activities.repository";
import type { IntervalsIcuActivityDetail } from "@korex/integrations/intervals-icu/client";
import { describe, expect, it } from "vitest";
import { IntervalsIcuActivityDetailBuilder } from "../../../setup/integration/test-data/intervals-icu-activity-detail-builder";

describe("storeIntervalsIcuActivityImport", () => {
  it("stores supported activity details through the activity import writer", async () => {
    const calls = createWriterCalls();
    const detail = IntervalsIcuActivityDetailBuilder.init().build();
    const result = await runStoreActivityImport({
      calls,
      detail,
      upsertedExternalActivity: {
        activityId: null,
        created: true,
        externalActivityId: 10,
        updated: false,
      },
    });

    expect(result).toEqual({
      activityId: 20,
      created: true,
      externalActivityId: 10,
      providerActivityId: "activity-1",
      skipped: false,
      updated: false,
    });
    expect(calls.storeExternalActivity).toHaveLength(1);
    expect(calls.storeExternalActivity[0]).toMatchObject({
      lastSyncRunId: 123,
      provider: "intervals_icu",
      providerActivityId: "activity-1",
      providerAthleteId: "athlete-1",
      sportType: "Run",
      userId: "user-1",
    });
    expect(calls.storeCoreActivity).toHaveLength(1);
    expect(calls.storeCoreActivity[0]?.activity).toMatchObject({
      name: "Morning Run",
      sportType: "run",
      userId: "user-1",
    });
    expect(calls.storeCoreActivity[0]?.laps).toEqual([
      expect.objectContaining({
        distanceMeters: 1000,
        endTimeSeconds: 300,
        index: 0,
        startTimeSeconds: 0,
      }),
    ]);
    expect(calls.unlinkUnsupportedActivity).toEqual([]);
  });

  it("unlinks an existing core activity when the provider activity is now unsupported", async () => {
    const calls = createWriterCalls();
    const result = await runStoreActivityImport({
      calls,
      detail: IntervalsIcuActivityDetailBuilder.init().withType("Ride").build(),
      upsertedExternalActivity: {
        activityId: 20,
        created: false,
        externalActivityId: 10,
        updated: true,
      },
    });

    expect(result).toEqual({
      externalActivityId: 10,
      skipped: true,
    });
    expect(calls.storeCoreActivity).toEqual([]);
    expect(calls.unlinkUnsupportedActivity).toEqual([
      {
        activityId: 20,
        externalActivityId: 10,
      },
    ]);
  });

  it("skips core storage when lap translation fails after storing the external activity", async () => {
    const calls = createWriterCalls();
    const errors: ActivitySyncFailure[] = [];
    const result = await runStoreActivityImport({
      calls,
      detail: IntervalsIcuActivityDetailBuilder.init()
        .withIntervals([
          {
            distance: 1000,
            end_time: 300,
            start_time: 0,
          },
          {
            distance: 500,
            end_time: 500,
            start_time: 350,
          },
        ])
        .build(),
      errors,
      upsertedExternalActivity: {
        activityId: null,
        created: true,
        externalActivityId: 10,
        updated: false,
      },
    });

    expect(result).toEqual({
      externalActivityId: 10,
      skipped: true,
    });
    expect(calls.storeExternalActivity).toHaveLength(1);
    expect(calls.storeCoreActivity).toEqual([]);
    expect(errors).toEqual([
      expect.objectContaining({
        activityId: "activity-1",
        stage: "detail",
      }),
    ]);
  });
});

function runStoreActivityImport({
  calls,
  detail,
  errors = [],
  upsertedExternalActivity,
}: {
  calls: WriterCalls;
  detail: IntervalsIcuActivityDetail;
  errors?: ActivitySyncFailure[];
  upsertedExternalActivity: UpsertExternalActivityResult;
}) {
  const writer: ActivityImportWriterService = {
    storeExternalActivity: (input) => {
      calls.storeExternalActivity.push(input);
      return Promise.resolve(upsertedExternalActivity);
    },
    storeCoreActivity: (input) => {
      calls.storeCoreActivity.push(input);
      return Promise.resolve({
        activityId: 20,
        created: input.activityId === null,
      });
    },
    unlinkUnsupportedActivity: (input) => {
      calls.unlinkUnsupportedActivity.push(input);
      return Promise.resolve();
    },
  };
  return storeIntervalsIcuActivityImport({
    detail,
    errors,
    lastSyncRunId: 123,
    providerAthleteId: "athlete-1",
    userId: "user-1",
    writer,
  });
}

type WriterCalls = {
  storeExternalActivity: UpsertExternalActivityInput[];
  storeCoreActivity: {
    activity: ActivityInput;
    activityId: number | null;
    externalActivityId: number;
    laps: ActivityLapInput[];
  }[];
  unlinkUnsupportedActivity: {
    activityId: number;
    externalActivityId: number;
  }[];
};

function createWriterCalls(): WriterCalls {
  return {
    storeCoreActivity: [],
    storeExternalActivity: [],
    unlinkUnsupportedActivity: [],
  };
}
