import { Data } from "effect";

export class ActivitySyncError extends Data.TaggedError("ActivitySyncError")<{
  cause?: unknown;
  details?: unknown;
  message: string;
}> {}

export class SuccessfulActivitySyncExistsError extends Data.TaggedError(
  "SuccessfulActivitySyncExistsError",
)<{
  message: string;
}> {}

export class SuccessfulActivitySyncNotFoundError extends Data.TaggedError(
  "SuccessfulActivitySyncNotFoundError",
)<{
  message: string;
}> {}

export class IncrementalActivitySyncRateLimitedError extends Data.TaggedError(
  "IncrementalActivitySyncRateLimitedError",
)<{
  message: string;
}> {}

export class ActivitySyncProviderNotSupportedError extends Data.TaggedError(
  "ActivitySyncProviderNotSupportedError",
)<{
  provider: string;
}> {}
