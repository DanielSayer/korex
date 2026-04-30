export type FetchIntervalsIcuActivitiesInput = {
  endDate: Date;
  startDate: Date;
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
  message: string;
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
