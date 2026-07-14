import { ORPCError } from "@orpc/server";
import type { ProviderSecretEncryptionError } from "./provider-secret-encryption";

export class InvalidProviderCredentialError extends Error {
  readonly _tag = "InvalidProviderCredentialError";
  readonly cause?: unknown;

  constructor({
    cause,
    message,
  }: {
    cause?: unknown;
    message: string;
  }) {
    super(message);
    this.name = "InvalidProviderCredentialError";
    this.cause = cause;
  }
}

export class ProviderUnavailableError extends Error {
  readonly _tag = "ProviderUnavailableError";
  readonly cause?: unknown;

  constructor({
    cause,
    message,
  }: {
    cause?: unknown;
    message: string;
  }) {
    super(message);
    this.name = "ProviderUnavailableError";
    this.cause = cause;
  }
}

export class ActiveProviderConnectionNotFoundError extends Error {
  readonly _tag = "ActiveProviderConnectionNotFoundError";

  constructor({
    message,
  }: {
    message: string;
  }) {
    super(message);
    this.name = "ActiveProviderConnectionNotFoundError";
  }
}

type ProviderConnectionError =
  | ActiveProviderConnectionNotFoundError
  | InvalidProviderCredentialError
  | ProviderSecretEncryptionError
  | ProviderUnavailableError;

type ProviderConnectionErrorTag = ProviderConnectionError["_tag"];
type ProviderConnectionOrpcCode =
  | "BAD_GATEWAY"
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "INTERNAL_SERVER_ERROR";

const providerConnectionErrorMap = {
  ActiveProviderConnectionNotFoundError: {
    code: "NOT_FOUND",
    message: "Active provider connection not found",
  },
  InvalidProviderCredentialError: {
    code: "BAD_REQUEST",
    message: "Invalid provider credentials",
  },
  ProviderSecretEncryptionError: {
    code: "INTERNAL_SERVER_ERROR",
    message: "Failed to store provider credentials",
  },
  ProviderUnavailableError: {
    code: "BAD_GATEWAY",
    message: "Provider is unavailable",
  },
} satisfies Record<
  ProviderConnectionErrorTag,
  { code: ProviderConnectionOrpcCode; message: string }
>;

export async function runProviderConnectionOperation<A>(operation: Promise<A>) {
  try {
    return await operation;
  } catch (cause) {
    throw toProviderConnectionOrpcError(cause);
  }
}

function toProviderConnectionOrpcError(cause: unknown) {
  if (cause instanceof ORPCError) {
    return cause;
  }

  if (isProviderConnectionError(cause)) {
    const errorConfig = providerConnectionErrorMap[cause._tag];

    return new ORPCError(errorConfig.code, {
      message: errorConfig.message,
      cause,
    });
  }

  return new ORPCError("INTERNAL_SERVER_ERROR", {
    message: "Failed to connect provider",
    cause,
  });
}

function isProviderConnectionError(
  cause: unknown,
): cause is ProviderConnectionError {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "_tag" in cause &&
    typeof cause._tag === "string" &&
    cause._tag in providerConnectionErrorMap
  );
}
