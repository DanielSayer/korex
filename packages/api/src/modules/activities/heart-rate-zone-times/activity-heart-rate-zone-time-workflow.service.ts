import { Effect } from "effect";
import type { ActivityHeartRateZoneSnapshotInput } from "../activities.types";
import type { ActivityHeartRateZoneTimeCalculationJob } from "./activity-heart-rate-zone-time-jobs.repository";
import {
  ActivityHeartRateZoneTimeWorkflow,
  type RunActivityHeartRateZoneTimeWorkerOnceInput,
} from "./activity-heart-rate-zone-time-workflow.dependencies";

export function processActivityHeartRateZoneTimeCalculationJob(
  job: ActivityHeartRateZoneTimeCalculationJob,
) {
  return Effect.gen(function* () {
    const workflow = yield* ActivityHeartRateZoneTimeWorkflow;

    return yield* workflow.processActivityHeartRateZoneTimeCalculationJob(job);
  });
}

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

export function runActivityHeartRateZoneTimeWorkerOnce(
  input: RunActivityHeartRateZoneTimeWorkerOnceInput,
) {
  return Effect.gen(function* () {
    const workflow = yield* ActivityHeartRateZoneTimeWorkflow;

    return yield* workflow.runActivityHeartRateZoneTimeWorkerOnce(input);
  });
}
