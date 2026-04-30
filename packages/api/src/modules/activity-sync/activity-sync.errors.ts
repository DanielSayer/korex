import { Data } from "effect";

export class ActivitySyncError extends Data.TaggedError("ActivitySyncError")<{
  cause?: unknown;
  message: string;
}> {}
