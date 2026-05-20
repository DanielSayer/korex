import { Effect } from "effect";
import type {
  ActivityHeartRateZoneSnapshotInput,
  ActivityStreamInput,
} from "../activities.types";
import { ActivityHeartRateZoneTimeWorkflowLive } from "./activity-heart-rate-zone-time-workflow.live";
import {
  replaceActivityHeartRateZoneSnapshotsAndQueueCalculation,
  replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation,
} from "./activity-heart-rate-zone-time-workflow.service";

export function replaceActivityHeartRateZoneSnapshotsAndQueueCalculationPromise(input: {
  activityId: number;
  snapshots: ActivityHeartRateZoneSnapshotInput[];
}) {
  return Effect.runPromise(
    replaceActivityHeartRateZoneSnapshotsAndQueueCalculation(input).pipe(
      Effect.provide(ActivityHeartRateZoneTimeWorkflowLive),
    ),
  );
}

export function replaceActivityStreamsAndQueueHeartRateZoneTimeCalculationPromise(input: {
  activityId: number;
  streams: ActivityStreamInput[];
  userId: string;
}) {
  return Effect.runPromise(
    replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation(input).pipe(
      Effect.provide(ActivityHeartRateZoneTimeWorkflowLive),
    ),
  );
}
