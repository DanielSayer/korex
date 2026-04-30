import type { IntervalsIcuClientService } from "@korex/integrations/intervals-icu/client";
import { Context, type Effect } from "effect";
import type { ActivitySyncError } from "./activity-sync.errors";
import type {
  ActivitySyncCounters,
  ActivitySyncFailure,
} from "./activity-sync.types";

export type ActivitySyncRepositoryService = {
  createActivitySyncRun: (input: {
    provider: "intervals_icu";
    syncType: "manual";
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
};

export class ActivitySyncRepository extends Context.Tag(
  "ActivitySyncRepository",
)<ActivitySyncRepository, ActivitySyncRepositoryService>() {}

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
