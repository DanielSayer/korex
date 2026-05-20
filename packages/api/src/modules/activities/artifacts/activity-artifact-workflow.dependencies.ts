import { Context, type Effect } from "effect";
import type { ActivityMapInput } from "../activities.types";

export type ActivityArtifactWorkflowService = {
  replaceActivityMapAndQueueHeatmapCalculation: (input: {
    activityId: number;
    map: ActivityMapInput;
  }) => Effect.Effect<void>;
};

export class ActivityArtifactWorkflow extends Context.Tag(
  "ActivityArtifactWorkflow",
)<ActivityArtifactWorkflow, ActivityArtifactWorkflowService>() {}
