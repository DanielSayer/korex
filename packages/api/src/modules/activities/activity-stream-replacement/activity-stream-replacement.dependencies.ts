import { Context, type Effect } from "effect";
import type { ActivityStreamInput } from "../activities.types";
import type { replaceActivityStreams } from "../artifacts/activity-artifacts.repository";
import type { enqueueActivityBestEffortCalculation } from "../best-efforts/activity-best-effort-jobs.repository";
import type {
  clearActivityHeartRateZoneCalculation,
  clearActivityHeartRateZoneTimes,
  listUserHeartRateZoneSnapshots,
  replaceActivityHeartRateZoneSnapshots,
} from "../heart-rate-zone-times/activity-heart-rate-zone-time.repository";
export type ActivityStreamReplacementDatabase = NonNullable<
  Parameters<typeof replaceActivityStreams>[0]["database"]
>;

export type ActivityStreamsRepositoryService = {
  replaceActivityStreams: (
    input: Omit<Parameters<typeof replaceActivityStreams>[0], "database"> & {
      database?: ActivityStreamReplacementDatabase;
    },
  ) => Promise<void>;
};

export class ActivityStreamsRepository extends Context.Tag(
  "ActivityStreamReplacementStreamsRepository",
)<ActivityStreamsRepository, ActivityStreamsRepositoryService>() {}

export type ActivityBestEffortJobRepositoryService = {
  enqueueActivityBestEffortCalculation: (
    input: Omit<
      Parameters<typeof enqueueActivityBestEffortCalculation>[0],
      "database"
    > & { database?: ActivityStreamReplacementDatabase },
  ) => Promise<void>;
};

export class ActivityBestEffortJobRepository extends Context.Tag(
  "ActivityStreamReplacementBestEffortJobRepository",
)<ActivityBestEffortJobRepository, ActivityBestEffortJobRepositoryService>() {}

export type HeartRateZoneSnapshotRepositoryService = {
  clearActivityHeartRateZoneCalculation: (
    input: Omit<
      Parameters<typeof clearActivityHeartRateZoneCalculation>[0],
      "database"
    > & { database?: ActivityStreamReplacementDatabase },
  ) => Promise<void>;
  clearActivityHeartRateZoneTimes: (
    input: Omit<
      Parameters<typeof clearActivityHeartRateZoneTimes>[0],
      "database"
    > & { database?: ActivityStreamReplacementDatabase },
  ) => Promise<void>;
  listUserHeartRateZoneSnapshots: (
    input: Omit<
      Parameters<typeof listUserHeartRateZoneSnapshots>[0],
      "database"
    > & { database?: ActivityStreamReplacementDatabase },
  ) => ReturnType<typeof listUserHeartRateZoneSnapshots>;
  replaceActivityHeartRateZoneSnapshots: (
    input: Omit<
      Parameters<typeof replaceActivityHeartRateZoneSnapshots>[0],
      "database"
    > & { database?: ActivityStreamReplacementDatabase },
  ) => Promise<void>;
  transaction: <T>(
    work: (database: ActivityStreamReplacementDatabase) => Promise<T>,
  ) => Promise<T>;
};

export class HeartRateZoneSnapshotRepository extends Context.Tag(
  "ActivityStreamReplacementHeartRateZoneSnapshotRepository",
)<HeartRateZoneSnapshotRepository, HeartRateZoneSnapshotRepositoryService>() {}

export type HeartRateZoneTimeJobRepositoryService = {
  deleteActivityHeartRateZoneTimeCalculationJob: (input: {
    activityId: number;
    database?: ActivityStreamReplacementDatabase;
  }) => Promise<void>;
  enqueueActivityHeartRateZoneTimeCalculation: (input: {
    activityId: number;
    database?: ActivityStreamReplacementDatabase;
  }) => Promise<void>;
};

export class HeartRateZoneTimeJobRepository extends Context.Tag(
  "ActivityStreamReplacementHeartRateZoneTimeJobRepository",
)<HeartRateZoneTimeJobRepository, HeartRateZoneTimeJobRepositoryService>() {}

export type ActivityStreamReplacementWorkflowService = {
  replaceActivityStreamsAndInvalidateDerivedData: (input: {
    activityId: number;
    streams: ActivityStreamInput[];
    userId: string;
  }) => Effect.Effect<void>;
};

export class ActivityStreamReplacementWorkflow extends Context.Tag(
  "ActivityStreamReplacementWorkflow",
)<
  ActivityStreamReplacementWorkflow,
  ActivityStreamReplacementWorkflowService
>() {}
