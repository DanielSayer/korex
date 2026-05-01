import { Data } from "effect";

export class ActivitySyncError extends Data.TaggedError("ActivitySyncError")<{
  cause?: unknown;
  message: string;
}> {}

export class SuccessfulActivitySyncExistsError extends Data.TaggedError(
  "SuccessfulActivitySyncExistsError",
)<{
  message: string;
}> {}

export class ActivitySyncProviderNotSupportedError extends Data.TaggedError(
  "ActivitySyncProviderNotSupportedError",
)<{
  provider: string;
}> {}
