import { Effect } from "effect";
import type {
  ActivityHeartRateZoneSnapshotInput,
  ActivityStreamInput,
} from "../activities.types";
import { ActivityHeartRateZoneTimeWorkflow } from "./activity-heart-rate-zone-time-workflow.dependencies";

export function replaceActivityHeartRateZoneSnapshotsAndQueueCalculation(input: {
  activityId: number;
  snapshots: ActivityHeartRateZoneSnapshotInput[];
}) {
  return Effect.gen(function* () {
    const workflow = yield* ActivityHeartRateZoneTimeWorkflow;

    return yield* workflow.replaceActivityHeartRateZoneSnapshotsAndQueueCalculation(
      input,
    );
  });
}

export function replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation(input: {
  activityId: number;
  streams: ActivityStreamInput[];
  userId: string;
}) {
  return Effect.gen(function* () {
    const workflow = yield* ActivityHeartRateZoneTimeWorkflow;

    return yield* workflow.replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation(
      input,
    );
  });
}
