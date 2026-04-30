import { Context, Data, type Effect } from "effect";
import type {
  IntervalsIcuActivityDetail,
  IntervalsIcuActivityListItem,
  IntervalsIcuActivityMap,
  IntervalsIcuActivityStreams,
  IntervalsIcuAthleteProfile,
} from "./schemas";

export type {
  IntervalsIcuActivityDetail,
  IntervalsIcuActivityListItem,
  IntervalsIcuActivityMap,
  IntervalsIcuActivityStreams,
  IntervalsIcuAthleteProfile,
} from "./schemas";

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

export type ListIntervalsIcuActivitiesInput = {
  apiKey: string;
  athleteId: string;
  endDate: Date;
  startDate: Date;
};

export type GetIntervalsIcuActivityInput = {
  activityId: string;
  apiKey: string;
};

export type IntervalsIcuClientService = {
  getAthleteProfile: (
    input: GetIntervalsIcuAthleteProfileInput,
  ) => Effect.Effect<IntervalsIcuAthleteProfile, IntervalsIcuClientError>;
  getActivityDetail: (
    input: GetIntervalsIcuActivityInput,
  ) => Effect.Effect<IntervalsIcuActivityDetail, IntervalsIcuClientError>;
  getActivityMap: (
    input: GetIntervalsIcuActivityInput,
  ) => Effect.Effect<IntervalsIcuActivityMap | null, IntervalsIcuClientError>;
  getActivityStreams: (
    input: GetIntervalsIcuActivityInput,
  ) => Effect.Effect<
    IntervalsIcuActivityStreams | null,
    IntervalsIcuClientError
  >;
  listActivities: (
    input: ListIntervalsIcuActivitiesInput,
  ) => Effect.Effect<IntervalsIcuActivityListItem[], IntervalsIcuClientError>;
};

export class IntervalsIcuClient extends Context.Tag("IntervalsIcuClient")<
  IntervalsIcuClient,
  IntervalsIcuClientService
>() {}
