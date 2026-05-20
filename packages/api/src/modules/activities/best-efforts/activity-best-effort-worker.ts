import { Effect } from "effect";
import type { RunActivityBestEffortWorkerOnceInput } from "./activity-best-effort-workflow.dependencies";
import { ActivityBestEffortWorkflowLive } from "./activity-best-effort-workflow.live";
import { runActivityBestEffortWorkerOnce as runActivityBestEffortWorkerOnceWorkflow } from "./activity-best-effort-workflow.service";

export function runActivityBestEffortWorkerOnce(
  input: RunActivityBestEffortWorkerOnceInput,
) {
  return Effect.runPromise(
    runActivityBestEffortWorkerOnceWorkflow(input).pipe(
      Effect.provide(ActivityBestEffortWorkflowLive),
    ),
  );
}
