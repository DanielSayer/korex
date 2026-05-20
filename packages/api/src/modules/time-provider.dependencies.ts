import { Context, Layer } from "effect";

export type TimeProviderService = {
  now: () => Date;
};

export class TimeProvider extends Context.Tag("TimeProvider")<
  TimeProvider,
  TimeProviderService
>() {}

export const TimeProviderLive = Layer.succeed(TimeProvider, {
  now: () => new Date(),
});
