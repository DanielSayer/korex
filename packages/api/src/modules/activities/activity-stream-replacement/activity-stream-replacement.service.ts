import { Effect } from "effect";
import type { ActivityStreamInput } from "../activities.types";
import { ActivityStreamReplacementWorkflow } from "./activity-stream-replacement.dependencies";

export function replaceActivityStreamsAndInvalidateDerivedData(input: {
  activityId: number;
  streams: ActivityStreamInput[];
  userId: string;
}) {
  return Effect.gen(function* () {
    const workflow = yield* ActivityStreamReplacementWorkflow;

    return yield* workflow.replaceActivityStreamsAndInvalidateDerivedData(
      input,
    );
  });
}
