import {
  IntervalsIcuHttpClient,
  IntervalsIcuHttpClientError,
} from "@korex/integrations/intervals-icu/http-client";
import { Effect, Layer } from "effect";

export const intervalsIcuHttpClientSuccess = Layer.succeed(
  IntervalsIcuHttpClient,
  {
    fetch: () =>
      Effect.succeed(
        new Response(
          JSON.stringify({
            email: null,
            firstname: "Test",
            id: "123",
            lastname: "Athlete",
            name: "Test Athlete",
            sportsSettings: [
              {
                hr_zone_names: ["Recovery", "Aerobic"],
                hr_zones: [153, 170],
              },
            ],
            timezone: "Australia/Brisbane",
          }),
          { status: 200 },
        ),
      ),
  },
);

export const intervalsIcuHttpClientUnauthorized = Layer.succeed(
  IntervalsIcuHttpClient,
  {
    fetch: () =>
      Effect.succeed(
        new Response(null, {
          status: 401,
        }),
      ),
  },
);

export const intervalsIcuHttpClientInvalidProfile = Layer.succeed(
  IntervalsIcuHttpClient,
  {
    fetch: () =>
      Effect.succeed(
        new Response(
          JSON.stringify({
            id: "",
            name: "Test Athlete",
          }),
          { status: 200 },
        ),
      ),
  },
);

export const intervalsIcuHttpClientNetworkFailure = Layer.succeed(
  IntervalsIcuHttpClient,
  {
    fetch: () =>
      Effect.fail(
        new IntervalsIcuHttpClientError({
          message: "Network failed",
        }),
      ),
  },
);
