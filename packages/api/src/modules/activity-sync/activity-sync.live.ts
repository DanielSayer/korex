import { Layer } from "effect";
import { ProviderSessionLive } from "../provider-connections/provider-session.live";
import {
  ActivitySyncRepository,
  IntervalsIcuActivitySync,
} from "./activity-sync.dependencies";
import {
  createActivitySyncRun,
  finishActivitySyncRun,
} from "./repositories/sync-runs.repository";
import { syncIntervalsIcuActivity } from "./providers/intervals-icu/intervals-icu-sync";

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
