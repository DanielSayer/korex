import { Effect } from "effect";
import type { ActivityHeartRateZoneTimeCalculationJob } from "./activity-heart-rate-zone-time-jobs.repository";
import { ActivityHeartRateZoneTimeWorkflowLive } from "./activity-heart-rate-zone-time-workflow.live";
import { processActivityHeartRateZoneTimeCalculationJob as processActivityHeartRateZoneTimeCalculationJobWorkflow } from "./activity-heart-rate-zone-time-workflow.service";

export async function processActivityHeartRateZoneTimeCalculationJob(
  job: ActivityHeartRateZoneTimeCalculationJob,
) {
  await Effect.runPromise(
    processActivityHeartRateZoneTimeCalculationJobWorkflow(job).pipe(
      Effect.provide(ActivityHeartRateZoneTimeWorkflowLive),
    ),
  );
}
