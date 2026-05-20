import { Effect } from "effect";
import type { ActivityMapInput } from "../activities.types";
import { ActivityArtifactWorkflow } from "./activity-artifact-workflow.dependencies";

export function replaceActivityMapAndQueueHeatmapCalculation(input: {
  activityId: number;
  map: ActivityMapInput;
}) {
  return Effect.gen(function* () {
    const workflow = yield* ActivityArtifactWorkflow;

    return yield* workflow.replaceActivityMapAndQueueHeatmapCalculation(input);
  });
}
