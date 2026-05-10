import type { IntervalsIcuClientService } from "@korex/integrations/intervals-icu/client";
import { Context, type Effect } from "effect";
import type {
  ActivityInput,
  ActivityLapInput,
  ActivityMapInput,
  ActivityStreamInput,
} from "../activities/activities.types";
import type { ActivitySyncError } from "./activity-sync.errors";
import type {
  ActivitySyncCounters,
  ActivitySyncFailure,
} from "./activity-sync.types";
import type {
  UpsertExternalActivityInput,
  UpsertExternalActivityResult,
} from "./repositories/external-activities.repository";

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
  markProviderConnectionSynced: (input: {
    connectionId: number;
    syncedAt: Date;
  }) => Promise<void>;
};

export class ActivitySyncRepository extends Context.Tag(
  "ActivitySyncRepository",
)<ActivitySyncRepository, ActivitySyncRepositoryService>() {}

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

export class ActivityImportWriter extends Context.Tag("ActivityImportWriter")<
  ActivityImportWriter,
  ActivityImportWriterService
>() {}

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

export class ActivityArtifactStore extends Context.Tag("ActivityArtifactStore")<
  ActivityArtifactStore,
  ActivityArtifactStoreService
>() {}

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
  }) => Effect.Effect<void, ActivitySyncError>;
};

export class IntervalsIcuActivitySync extends Context.Tag(
  "IntervalsIcuActivitySync",
)<IntervalsIcuActivitySync, IntervalsIcuActivitySyncService>() {}
