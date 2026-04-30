import { Effect } from "effect";
import { createBasicAuthHeader } from "./auth";
import {
  type GetIntervalsIcuAthleteProfileInput,
  IntervalsIcuClientError,
} from "./client";
import { INTERVALS_ICU_BASIC_AUTH_USERNAME } from "./constants";
import type { IntervalsIcuHttpClientService } from "./http-client";
import { intervalsIcuAthleteProfileSchema } from "./schemas";

export function getIntervalsIcuAthleteProfileLive(
  { apiKey }: GetIntervalsIcuAthleteProfileInput,
  httpClient: IntervalsIcuHttpClientService,
) {
  return Effect.gen(function* () {
    const response = yield* httpClient
      .fetch("/api/v1/athlete/0", {
        headers: {
          Authorization: createBasicAuthHeader(
            INTERVALS_ICU_BASIC_AUTH_USERNAME,
            apiKey,
          ),
        },
      })
      .pipe(
        Effect.mapError(
          (cause) =>
            new IntervalsIcuClientError({
              cause,
              message: "Failed to request Intervals.icu athlete profile",
            }),
        ),
      );

    if (!response.ok) {
      return yield* Effect.fail(
        new IntervalsIcuClientError({
          message: "Intervals.icu athlete profile request failed",
          status: response.status,
        }),
      );
    }

    const json = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (cause) =>
        new IntervalsIcuClientError({
          cause,
          message: "Failed to parse Intervals.icu athlete profile response",
          status: response.status,
        }),
    });

    return yield* Effect.try({
      try: () => intervalsIcuAthleteProfileSchema.parse(json),
      catch: (cause) =>
        new IntervalsIcuClientError({
          cause,
          message: "Invalid Intervals.icu athlete profile response",
          status: response.status,
        }),
    });
  });
}
