import { Effect } from "effect";
import { createBasicAuthHeader } from "./auth";
import {
  type GetIntervalsIcuActivityInput,
  IntervalsIcuClientError,
  type ListIntervalsIcuActivitiesInput,
} from "./client";
import { INTERVALS_ICU_BASIC_AUTH_USERNAME } from "./constants";
import {
  getIntervalsIcuRequestUrl,
  type IntervalsIcuHttpClientService,
} from "./http-client";
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
    oldest: toIntervalsIcuDateParam(startDate),
    newest: toIntervalsIcuDateParam(endDate),
  });

  return requestIntervalsIcuJson({
    apiKey,
    httpClient,
    path: `/api/v1/athlete/${encodeURIComponent(athleteId)}/activities?${searchParams.toString()}`,
    schema: intervalsIcuActivityListSchema,
    subject: "activity list",
  });
}

function toIntervalsIcuDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
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
  const requestUrl = getIntervalsIcuRequestUrl(path);

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
              requestUrl,
            }),
        ),
      );

    if (!response.ok) {
      return yield* Effect.fail(
        new IntervalsIcuClientError({
          message: `Intervals.icu ${subject} request failed`,
          requestUrl,
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
          requestUrl,
          status: response.status,
        }),
    });

    return yield* Effect.try({
      try: () => schema.parse(json),
      catch: (cause) =>
        new IntervalsIcuClientError({
          cause,
          details: getInvalidResponseDetails(cause, json),
          message: `Invalid Intervals.icu ${subject} response`,
          requestUrl,
          status: response.status,
        }),
    });
  });
}

function getInvalidResponseDetails(cause: unknown, value: unknown) {
  return {
    parseIssues: readZodIssues(cause),
    responseShape: describeValue(value),
  };
}

function readZodIssues(cause: unknown) {
  if (!isRecord(cause) || !Array.isArray(cause.issues)) {
    return [];
  }

  return cause.issues.slice(0, 10).map((issue) => {
    if (!isRecord(issue)) {
      return { message: "Unknown parse issue" };
    }

    return {
      code: issue.code,
      message: issue.message,
      path: Array.isArray(issue.path) ? issue.path.join(".") : undefined,
    };
  });
}

function describeValue(value: unknown) {
  if (Array.isArray(value)) {
    return {
      length: value.length,
      type: "array",
    };
  }

  if (isRecord(value)) {
    const keys = Object.keys(value);

    return {
      keys: keys.slice(0, 20),
      keyCount: keys.length,
      type: "object",
    };
  }

  return {
    type: value === null ? "null" : typeof value,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
