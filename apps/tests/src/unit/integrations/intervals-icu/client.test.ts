import { IntervalsIcuClient } from "@korex/integrations/intervals-icu/client";
import type { IntervalsIcuHttpClient } from "@korex/integrations/intervals-icu/http-client";
import { IntervalsIcuClientLayer } from "@korex/integrations/intervals-icu/live";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import {
  intervalsIcuHttpClientInvalidProfile,
  intervalsIcuHttpClientNetworkFailure,
  intervalsIcuHttpClientSuccess,
  intervalsIcuHttpClientUnauthorized,
} from "../../../mocks/integrations/intervals-icu/http-client";

describe("Intervals.icu client", () => {
  it("fetches and parses an athlete profile", async () => {
    const athleteProfile = await Effect.runPromise(
      runClient("test-api-key", intervalsIcuHttpClientSuccess),
    );

    expect(athleteProfile).toEqual({
      email: null,
      firstname: "Test",
      id: "123",
      lastname: "Athlete",
      name: "Test Athlete",
      timezone: "Australia/Brisbane",
    });
  });

  it("fails when the athlete profile request is rejected", async () => {
    const result = await Effect.runPromiseExit(
      runClient("bad-api-key", intervalsIcuHttpClientUnauthorized),
    );

    expect(result._tag).toBe("Failure");
  });

  it("fails when the athlete profile response is invalid", async () => {
    const result = await Effect.runPromiseExit(
      runClient("test-api-key", intervalsIcuHttpClientInvalidProfile),
    );

    expect(result._tag).toBe("Failure");
  });

  it("maps http client failures to client failures", async () => {
    const result = await Effect.runPromiseExit(
      runClient("test-api-key", intervalsIcuHttpClientNetworkFailure),
    );

    expect(result._tag).toBe("Failure");
  });
});

function runClient(
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
