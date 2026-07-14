export type FetchIntervalsIcuActivitiesInput = {
  endDate: Date;
  signal?: AbortSignal;
  startDate: Date;
  syncRunId?: number;
  syncType?: "initial" | "incremental" | "manual";
  userId: string;
};

export type SyncUserActivitiesInput = {
  endDate: Date;
  signal?: AbortSignal;
  startDate: Date;
  syncRunId?: number;
  syncType: "initial" | "incremental";
  userId: string;
};

export type ActivitySyncStage =
  | "decrypt"
  | "detail"
  | "list"
  | "map"
  | "streams";

export type ActivitySyncFailure = {
  activityId?: string;
  details?: unknown;
  message: string;
  requestUrl?: string;
  stage: ActivitySyncStage;
};

export type ActivitySyncCounters = {
  activitiesCreated: number;
  activitiesSeen: number;
  activitiesStored: number;
  activitiesUpdated: number;
};

export type FetchIntervalsIcuActivitiesResult = ActivitySyncCounters & {
  errors: ActivitySyncFailure[];
  status: "success" | "failed" | "partial";
  syncRunId: number;
};
