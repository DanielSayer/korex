import { Context, type Effect } from "effect";
import type {
  ActivityHeartRateZoneSnapshotInput,
  ActivityStreamInput,
} from "../activities.types";
import type { ActivityHeartRateZoneTimeCalculationJob } from "./activity-heart-rate-zone-time-jobs.repository";

export type RunActivityHeartRateZoneTimeWorkerOnceInput = {
  batchSize: number;
  now?: Date;
  staleLockMs: number;
  workerId: string;
};

export type ActivityHeartRateZoneTimeWorkflowService = {
  processActivityHeartRateZoneTimeCalculationJob: (
    job: ActivityHeartRateZoneTimeCalculationJob,
  ) => Effect.Effect<void>;
  replaceActivityHeartRateZoneSnapshotsAndQueueCalculation: (input: {
    activityId: number;
    snapshots: ActivityHeartRateZoneSnapshotInput[];
  }) => Effect.Effect<void>;
  replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation: (input: {
    activityId: number;
    streams: ActivityStreamInput[];
    userId: string;
  }) => Effect.Effect<void>;
  runActivityHeartRateZoneTimeWorkerOnce: (
    input: RunActivityHeartRateZoneTimeWorkerOnceInput,
  ) => Effect.Effect<{ processed: number }>;
};

export class ActivityHeartRateZoneTimeWorkflow extends Context.Tag(
  "ActivityHeartRateZoneTimeWorkflow",
)<
  ActivityHeartRateZoneTimeWorkflow,
  ActivityHeartRateZoneTimeWorkflowService
>() {}
