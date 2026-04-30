import { IntervalsIcuClient } from "@korex/integrations/intervals-icu/client";
import type { IntervalsIcuHttpClient } from "@korex/integrations/intervals-icu/http-client";
import { IntervalsIcuClientLayer } from "@korex/integrations/intervals-icu/live";
import { Effect, Layer } from "effect";

export function runClient(
  apiKey: string,
  httpClientLayer: Layer.Layer<IntervalsIcuHttpClient>,
) {
  return Effect.gen(function* () {
    const client = yield* IntervalsIcuClient;

    return yield* client.getAthleteProfile({
      apiKey,
    });
  }).pipe(
    Effect.provide(
      IntervalsIcuClientLayer.pipe(Layer.provide(httpClientLayer)),
    ),
  );
}

export function runActivityClient(
  httpClientLayer: Layer.Layer<IntervalsIcuHttpClient>,
) {
  return Effect.gen(function* () {
    const client = yield* IntervalsIcuClient;
    const activities = yield* client.listActivities({
      apiKey: "test-api-key",
      athleteId: "athlete-1",
      endDate: new Date("2026-04-02T00:00:00.000Z"),
      startDate: new Date("2026-04-01T00:00:00.000Z"),
    });
    const detail = yield* client.getActivityDetail({
      activityId: "activity-1",
      apiKey: "test-api-key",
    });
    const map = yield* client.getActivityMap({
      activityId: "activity-1",
      apiKey: "test-api-key",
    });
    const streams = yield* client.getActivityStreams({
      activityId: "activity-1",
      apiKey: "test-api-key",
    });

    return { activities, detail, map, streams };
  }).pipe(
    Effect.provide(
      IntervalsIcuClientLayer.pipe(Layer.provide(httpClientLayer)),
    ),
  );
}
