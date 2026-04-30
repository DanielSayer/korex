import { Effect, Layer } from "effect";
import {
  getIntervalsIcuActivityDetailLive,
  getIntervalsIcuActivityMapLive,
  getIntervalsIcuActivityStreamsLive,
  listIntervalsIcuActivitiesLive,
} from "./activity-live";
import { IntervalsIcuClient } from "./client";
import { getIntervalsIcuAthleteProfileLive } from "./get-athlete-profile-live";
import {
  IntervalsIcuHttpClient,
  IntervalsIcuHttpClientLive,
} from "./http-client";

export const IntervalsIcuClientLayer = Layer.effect(
  IntervalsIcuClient,
  Effect.gen(function* () {
    const httpClient = yield* IntervalsIcuHttpClient;

    return {
      getAthleteProfile: (input) =>
        getIntervalsIcuAthleteProfileLive(input, httpClient),
      getActivityDetail: (input) =>
        getIntervalsIcuActivityDetailLive(input, httpClient),
      getActivityMap: (input) =>
        getIntervalsIcuActivityMapLive(input, httpClient),
      getActivityStreams: (input) =>
        getIntervalsIcuActivityStreamsLive(input, httpClient),
      listActivities: (input) =>
        listIntervalsIcuActivitiesLive(input, httpClient),
    };
  }),
);

export const IntervalsIcuClientLive = IntervalsIcuClientLayer.pipe(
  Layer.provide(IntervalsIcuHttpClientLive),
);
