import { Effect, Layer } from "effect";
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
    };
  }),
);

export const IntervalsIcuClientLive = IntervalsIcuClientLayer.pipe(
  Layer.provide(IntervalsIcuHttpClientLive),
);
