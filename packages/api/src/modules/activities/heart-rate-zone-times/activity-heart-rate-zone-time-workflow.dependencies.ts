import { Context, type Effect } from "effect";
import type {
  ActivityHeartRateZoneSnapshotInput,
  ActivityStreamInput,
} from "../activities.types";

export type ActivityHeartRateZoneTimeWorkflowService = {
  replaceActivityHeartRateZoneSnapshotsAndQueueCalculation: (input: {
    activityId: number;
    snapshots: ActivityHeartRateZoneSnapshotInput[];
  }) => Effect.Effect<void>;
  replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation: (input: {
    activityId: number;
    streams: ActivityStreamInput[];
    userId: string;
  }) => Effect.Effect<void>;
};

export class ActivityHeartRateZoneTimeWorkflow extends Context.Tag(
  "ActivityHeartRateZoneTimeWorkflow",
)<
  ActivityHeartRateZoneTimeWorkflow,
  ActivityHeartRateZoneTimeWorkflowService
>() {}
