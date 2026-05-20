import { Effect } from "effect";
import type { RunActivityHeartRateZoneTimeWorkerOnceInput } from "./activity-heart-rate-zone-time-workflow.dependencies";
import { ActivityHeartRateZoneTimeWorkflowLive } from "./activity-heart-rate-zone-time-workflow.live";
import { runActivityHeartRateZoneTimeWorkerOnce as runActivityHeartRateZoneTimeWorkerOnceWorkflow } from "./activity-heart-rate-zone-time-workflow.service";

export function runActivityHeartRateZoneTimeWorkerOnce(
  input: RunActivityHeartRateZoneTimeWorkerOnceInput,
) {
  return Effect.runPromise(
    runActivityHeartRateZoneTimeWorkerOnceWorkflow(input).pipe(
      Effect.provide(ActivityHeartRateZoneTimeWorkflowLive),
    ),
  );
}
