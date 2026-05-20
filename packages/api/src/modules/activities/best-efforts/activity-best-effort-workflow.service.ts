import { Effect } from "effect";
import type { ActivityBestEffortCalculationJob } from "./activity-best-effort-jobs.repository";
import {
  ActivityBestEffortWorkflow,
  type RunActivityBestEffortWorkerOnceInput,
} from "./activity-best-effort-workflow.dependencies";

export function processActivityBestEffortCalculationJob(
  job: ActivityBestEffortCalculationJob,
) {
  return Effect.gen(function* () {
    const workflow = yield* ActivityBestEffortWorkflow;

    return yield* workflow.processActivityBestEffortCalculationJob(job);
  });
}

export function runActivityBestEffortWorkerOnce(
  input: RunActivityBestEffortWorkerOnceInput,
) {
  return Effect.gen(function* () {
    const workflow = yield* ActivityBestEffortWorkflow;

    return yield* workflow.runActivityBestEffortWorkerOnce(input);
  });
}
