import type { IntervalsIcuClientService } from "@korex/integrations/intervals-icu/client";
import type {
  ActivityInput,
  ActivityLapInput,
  ActivityMapInput,
  ActivityStreamInput,
} from "../activities/activities.types";
import type {
  replaceActivityLaps,
  upsertActivity,
} from "../activities/artifacts/activity-import.repository";
import type { enqueueActivityRouteHeatmapCalculation } from "../activities/route-heatmap/activity-route-heatmap-jobs.repository";
import type {
  ActivitySyncCounters,
  ActivitySyncFailure,
} from "./activity-sync.types";
import type {
  clearExternalActivityActivityLink,
  linkExternalActivityToActivity,
  UpsertExternalActivityInput,
  UpsertExternalActivityResult,
} from "./repositories/external-activities.repository";

export type ActivityImportDatabase = NonNullable<
  Parameters<typeof upsertActivity>[0]["database"]
>;

export type ActivityImportRepositoryService = {
  deleteActivity: (
    activityId: number,
    database?: ActivityImportDatabase,
  ) => Promise<void>;
  replaceActivityLaps: (
    input: Omit<Parameters<typeof replaceActivityLaps>[0], "database"> & {
      database?: ActivityImportDatabase;
    },
  ) => Promise<void>;
  transaction: <T>(
    work: (database: ActivityImportDatabase) => Promise<T>,
  ) => Promise<T>;
  upsertActivity: (
    input: Omit<Parameters<typeof upsertActivity>[0], "database"> & {
      database?: ActivityImportDatabase;
    },
  ) => ReturnType<typeof upsertActivity>;
};

export type ExternalActivityRepositoryService = {
  clearExternalActivityActivityLink: (
    externalActivityId: number,
    database?: ActivityImportDatabase,
  ) => ReturnType<typeof clearExternalActivityActivityLink>;
  linkExternalActivityToActivity: (
    input: Omit<
      Parameters<typeof linkExternalActivityToActivity>[0],
      "database"
    > & { database?: ActivityImportDatabase },
  ) => ReturnType<typeof linkExternalActivityToActivity>;
  upsertExternalActivity: (
    input: UpsertExternalActivityInput,
  ) => Promise<UpsertExternalActivityResult>;
};

export type ActivityRouteHeatmapJobRepositoryService = {
  enqueueActivityRouteHeatmapCalculation: (
    input: Omit<
      Parameters<typeof enqueueActivityRouteHeatmapCalculation>[0],
      "database"
    > & { database?: ActivityImportDatabase },
  ) => Promise<void>;
};

export type ActivitySyncRepositoryService = {
  createActivitySyncRun: (input: {
    provider: "intervals_icu";
    syncType: "initial" | "incremental" | "manual";
    userId: string;
  }) => Promise<{ id: number }>;
  finishActivitySyncRun: (input: {
    activitiesCreated: number;
    activitiesSeen: number;
    activitiesUpdated: number;
    errorCode?: string;
    errorMessage?: string;
    metadata?: unknown;
    status: "failed" | "partial" | "success";
    syncRunId: number;
  }) => Promise<void>;
  hasSuccessfulActivitySyncRunForUser: (userId: string) => Promise<boolean>;
  getLatestSuccessfulActivitySyncRunForUser: (
    userId: string,
  ) => Promise<{ id: number; startedAt: Date } | null>;
  getLatestIncrementalActivitySyncRunForUser: (
    userId: string,
  ) => Promise<{ id: number; startedAt: Date } | null>;
  markProviderConnectionSynced: (input: {
    connectionId: number;
    syncedAt: Date;
  }) => Promise<void>;
};

export type ActivityImportWriterService = {
  storeExternalActivity: (
    input: UpsertExternalActivityInput,
  ) => Promise<UpsertExternalActivityResult>;
  storeCoreActivity: (input: {
    activity: ActivityInput;
    activityId: number | null;
    externalActivityId: number;
    laps: ActivityLapInput[];
  }) => Promise<{
    activityId: number;
    created: boolean;
  }>;
  unlinkUnsupportedActivity: (input: {
    activityId: number;
    externalActivityId: number;
  }) => Promise<void>;
};

export type ActivityArtifactStoreService = {
  storeExternalMap: (input: {
    externalActivityId: number;
    lastSyncRunId: number;
    provider: "intervals_icu";
    providerActivityId: string;
    rawData: unknown;
    userId: string;
  }) => Promise<void>;
  replaceCoreMap: (input: {
    activityId: number;
    map: ActivityMapInput;
  }) => Promise<void>;
  storeExternalStream: (input: {
    externalActivityId: number;
    lastSyncRunId: number;
    provider: "intervals_icu";
    providerActivityId: string;
    rawData: unknown;
    streamType: string;
    userId: string;
  }) => Promise<void>;
  replaceCoreStreamsAndQueueCalculation: (input: {
    activityId: number;
    streams: ActivityStreamInput[];
    userId: string;
  }) => Promise<void>;
};

export type IntervalsIcuActivitySyncService = {
  syncActivity: (input: {
    activityId: string;
    apiKey: string;
    athleteId: string;
    client: IntervalsIcuClientService;
    counters: ActivitySyncCounters;
    errors: ActivitySyncFailure[];
    syncRunId: number;
    userId: string;
    signal?: AbortSignal;
  }) => Promise<void>;
};
