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

export class IntervalsIcuClientError extends Error {
  readonly _tag = "IntervalsIcuClientError";
  readonly cause?: unknown;
  readonly details?: unknown;
  readonly requestUrl?: string;
  readonly status?: number;

  constructor({
    cause,
    details,
    message,
    requestUrl,
    status,
  }: {
    cause?: unknown;
    details?: unknown;
    message: string;
    requestUrl?: string;
    status?: number;
  }) {
    super(message);
    this.name = "IntervalsIcuClientError";
    this.cause = cause;
    this.details = details;
    this.requestUrl = requestUrl;
    this.status = status;
  }
}

export type GetIntervalsIcuAthleteProfileInput = {
  apiKey: string;
  signal?: AbortSignal;
};

export type ListIntervalsIcuActivitiesInput = {
  apiKey: string;
  athleteId: string;
  endDate: Date;
  signal?: AbortSignal;
  startDate: Date;
};

export type GetIntervalsIcuActivityInput = {
  activityId: string;
  apiKey: string;
  signal?: AbortSignal;
};

export type IntervalsIcuClientService = {
  getAthleteProfile: (
    input: GetIntervalsIcuAthleteProfileInput,
  ) => Promise<IntervalsIcuAthleteProfile>;
  getActivityDetail: (
    input: GetIntervalsIcuActivityInput,
  ) => Promise<IntervalsIcuActivityDetail>;
  getActivityMap: (
    input: GetIntervalsIcuActivityInput,
  ) => Promise<IntervalsIcuActivityMap | null>;
  getActivityStreams: (
    input: GetIntervalsIcuActivityInput,
  ) => Promise<IntervalsIcuActivityStreams | null>;
  listActivities: (
    input: ListIntervalsIcuActivitiesInput,
  ) => Promise<IntervalsIcuActivityListItem[]>;
};
