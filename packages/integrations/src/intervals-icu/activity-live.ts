import { Effect } from "effect";
import { createBasicAuthHeader } from "./auth";
import {
  type GetIntervalsIcuActivityInput,
  IntervalsIcuClientError,
  type ListIntervalsIcuActivitiesInput,
} from "./client";
import { INTERVALS_ICU_BASIC_AUTH_USERNAME } from "./constants";
import type { IntervalsIcuHttpClientService } from "./http-client";
import {
  intervalsIcuActivityDetailSchema,
  intervalsIcuActivityListSchema,
  intervalsIcuActivityMapSchema,
  intervalsIcuActivityStreamsSchema,
} from "./schemas";

export function listIntervalsIcuActivitiesLive(
  { apiKey, athleteId, endDate, startDate }: ListIntervalsIcuActivitiesInput,
  httpClient: IntervalsIcuHttpClientService,
) {
  const searchParams = new URLSearchParams({
    oldest: startDate.toISOString(),
    newest: endDate.toISOString(),
  });

  return requestIntervalsIcuJson({
    apiKey,
    httpClient,
    path: `/api/v1/athlete/${encodeURIComponent(athleteId)}/activities?${searchParams.toString()}`,
    schema: intervalsIcuActivityListSchema,
    subject: "activity list",
  });
}

export function getIntervalsIcuActivityDetailLive(
  { activityId, apiKey }: GetIntervalsIcuActivityInput,
  httpClient: IntervalsIcuHttpClientService,
) {
  return requestIntervalsIcuJson({
    apiKey,
    httpClient,
    path: `/api/v1/activity/${encodeURIComponent(activityId)}?intervals=true`,
    schema: intervalsIcuActivityDetailSchema,
    subject: "activity detail",
  });
}

export function getIntervalsIcuActivityMapLive(
  { activityId, apiKey }: GetIntervalsIcuActivityInput,
  httpClient: IntervalsIcuHttpClientService,
) {
  return requestIntervalsIcuJson({
    apiKey,
    httpClient,
    path: `/api/v1/activity/${encodeURIComponent(activityId)}/map`,
    schema: intervalsIcuActivityMapSchema,
    subject: "activity map",
  });
}

export function getIntervalsIcuActivityStreamsLive(
  { activityId, apiKey }: GetIntervalsIcuActivityInput,
  httpClient: IntervalsIcuHttpClientService,
) {
  return requestIntervalsIcuJson({
    apiKey,
    httpClient,
    path: `/api/v1/activity/${encodeURIComponent(activityId)}/streams.json`,
    schema: intervalsIcuActivityStreamsSchema,
    subject: "activity streams",
  });
}

function requestIntervalsIcuJson<A>({
  apiKey,
  httpClient,
  path,
  schema,
  subject,
}: {
  apiKey: string;
  httpClient: IntervalsIcuHttpClientService;
  path: string;
  schema: { parse: (value: unknown) => A };
  subject: string;
}) {
  return Effect.gen(function* () {
    const response = yield* httpClient
      .fetch(path, {
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
              message: `Failed to request Intervals.icu ${subject}`,
            }),
        ),
      );

    if (!response.ok) {
      return yield* Effect.fail(
        new IntervalsIcuClientError({
          message: `Intervals.icu ${subject} request failed`,
          status: response.status,
        }),
      );
    }

    const json = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (cause) =>
        new IntervalsIcuClientError({
          cause,
          message: `Failed to parse Intervals.icu ${subject} response`,
          status: response.status,
        }),
    });

    return yield* Effect.try({
      try: () => schema.parse(json),
      catch: (cause) =>
        new IntervalsIcuClientError({
          cause,
          message: `Invalid Intervals.icu ${subject} response`,
          status: response.status,
        }),
    });
  });
}
