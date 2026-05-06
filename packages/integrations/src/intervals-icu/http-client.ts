import { Context, Data, Effect, Layer } from "effect";

const DEFAULT_BASE_URL = "https://intervals.icu";

export function getIntervalsIcuRequestUrl(path: string) {
  return `${DEFAULT_BASE_URL}${path}`;
}

export class IntervalsIcuHttpClientError extends Data.TaggedError(
  "IntervalsIcuHttpClientError",
)<{
  cause?: unknown;
  message: string;
  requestUrl?: string;
}> {}

export type IntervalsIcuHttpClientService = {
  fetch: (
    path: string,
    init: RequestInit,
  ) => Effect.Effect<Response, IntervalsIcuHttpClientError>;
};

export class IntervalsIcuHttpClient extends Context.Tag(
  "IntervalsIcuHttpClient",
)<IntervalsIcuHttpClient, IntervalsIcuHttpClientService>() {}

export const IntervalsIcuHttpClientLive = Layer.succeed(
  IntervalsIcuHttpClient,
  {
    fetch: (path, init) =>
      Effect.tryPromise({
        try: () => fetch(getIntervalsIcuRequestUrl(path), init),
        catch: (cause) =>
          new IntervalsIcuHttpClientError({
            cause,
            message: "Failed to request Intervals.icu",
            requestUrl: getIntervalsIcuRequestUrl(path),
          }),
      }),
  },
);
