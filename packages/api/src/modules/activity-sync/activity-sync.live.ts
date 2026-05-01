import { Layer } from "effect";
import { ProviderSessionLive } from "../provider-connections/provider-session.live";
import {
  ActivitySyncRepository,
  IntervalsIcuActivitySync,
} from "./activity-sync.dependencies";
import { syncIntervalsIcuActivity } from "./providers/intervals-icu/intervals-icu-sync";
import {
  createActivitySyncRun,
  finishActivitySyncRun,
} from "./repositories/sync-runs.repository";

export const ActivitySyncRepositoryLive = Layer.succeed(
  ActivitySyncRepository,
  {
    createActivitySyncRun,
    finishActivitySyncRun,
  },
);

export const IntervalsIcuActivitySyncLive = Layer.succeed(
  IntervalsIcuActivitySync,
  {
    syncActivity: syncIntervalsIcuActivity,
  },
);

export const ActivitySyncLive = Layer.mergeAll(
  ActivitySyncRepositoryLive,
  ProviderSessionLive,
  IntervalsIcuActivitySyncLive,
);
