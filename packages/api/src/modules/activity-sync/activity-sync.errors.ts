export class ActivitySyncError extends Error {
  readonly _tag = "ActivitySyncError";
  readonly cause?: unknown;
  readonly details?: unknown;

  constructor({
    cause,
    details,
    message,
  }: {
    cause?: unknown;
    details?: unknown;
    message: string;
  }) {
    super(message);
    this.name = "ActivitySyncError";
    this.cause = cause;
    this.details = details;
  }
}

export class SuccessfulActivitySyncExistsError extends Error {
  readonly _tag = "SuccessfulActivitySyncExistsError";

  constructor({ message }: { message: string }) {
    super(message);
    this.name = "SuccessfulActivitySyncExistsError";
  }
}

export class SuccessfulActivitySyncNotFoundError extends Error {
  readonly _tag = "SuccessfulActivitySyncNotFoundError";

  constructor({ message }: { message: string }) {
    super(message);
    this.name = "SuccessfulActivitySyncNotFoundError";
  }
}

export class IncrementalActivitySyncRateLimitedError extends Error {
  readonly _tag = "IncrementalActivitySyncRateLimitedError";

  constructor({ message }: { message: string }) {
    super(message);
    this.name = "IncrementalActivitySyncRateLimitedError";
  }
}

export class ActivitySyncProviderNotSupportedError extends Error {
  readonly _tag = "ActivitySyncProviderNotSupportedError";
  readonly provider: string;

  constructor({ provider }: { provider: string }) {
    super(`Activity sync provider is not supported: ${provider}`);
    this.name = "ActivitySyncProviderNotSupportedError";
    this.provider = provider;
  }
}
