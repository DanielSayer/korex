import { createBasicAuthHeader } from "./auth";
import {
  type GetIntervalsIcuAthleteProfileInput,
  IntervalsIcuClientError,
} from "./client";
import { INTERVALS_ICU_BASIC_AUTH_USERNAME } from "./constants";
import type { IntervalsIcuHttpClientService } from "./http-client";
import { intervalsIcuAthleteProfileSchema } from "./schemas";

export async function getIntervalsIcuAthleteProfileLive(
  { apiKey, signal }: GetIntervalsIcuAthleteProfileInput,
  httpClient: IntervalsIcuHttpClientService,
) {
  let response: Response;
  try {
    response = await httpClient.fetch("/api/v1/athlete/0", {
      headers: {
        Authorization: createBasicAuthHeader(
          INTERVALS_ICU_BASIC_AUTH_USERNAME,
          apiKey,
        ),
      },
      signal,
    });
  } catch (cause) {
    throw new IntervalsIcuClientError({
      cause,
      message: "Failed to request Intervals.icu athlete profile",
    });
  }

  if (!response.ok) {
    throw new IntervalsIcuClientError({
      message: "Intervals.icu athlete profile request failed",
      status: response.status,
    });
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (cause) {
    throw new IntervalsIcuClientError({
      cause,
      message: "Failed to parse Intervals.icu athlete profile response",
      status: response.status,
    });
  }

  try {
    return intervalsIcuAthleteProfileSchema.parse(json);
  } catch (cause) {
    throw new IntervalsIcuClientError({
      cause,
      message: "Invalid Intervals.icu athlete profile response",
      status: response.status,
    });
  }
}
