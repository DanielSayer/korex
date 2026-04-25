import { Context, Data, type Effect } from "effect";
import type { IntervalsIcuAthleteProfile } from "./schemas";

export type { IntervalsIcuAthleteProfile } from "./schemas";

export class IntervalsIcuClientError extends Data.TaggedError(
  "IntervalsIcuClientError",
)<{
  cause?: unknown;
  message: string;
  status?: number;
}> {}

export type GetIntervalsIcuAthleteProfileInput = {
  apiKey: string;
};

export type IntervalsIcuClientService = {
  getAthleteProfile: (
    input: GetIntervalsIcuAthleteProfileInput,
  ) => Effect.Effect<IntervalsIcuAthleteProfile, IntervalsIcuClientError>;
};

export class IntervalsIcuClient extends Context.Tag("IntervalsIcuClient")<
  IntervalsIcuClient,
  IntervalsIcuClientService
>() {}
