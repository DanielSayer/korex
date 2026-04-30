import { IntervalsIcuClientLive } from "@korex/integrations/intervals-icu/live";
import { Effect, Layer } from "effect";
import { ActivitySyncLive } from "./activity-sync.live";
import {
  type FetchIntervalsIcuActivitiesInput,
  fetchIntervalsIcuActivities,
} from "./activity-sync.service";

export function executeFetchIntervalsIcuActivities(
  input: FetchIntervalsIcuActivitiesInput,
) {
  return Effect.runPromise(
    fetchIntervalsIcuActivities(input).pipe(
      Effect.provide(Layer.mergeAll(IntervalsIcuClientLive, ActivitySyncLive)),
    ),
  );
}
