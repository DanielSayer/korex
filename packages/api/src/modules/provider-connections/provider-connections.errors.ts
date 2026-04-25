import { ORPCError } from "@orpc/server";
import { Cause, Data, Effect, Exit, Option } from "effect";
import type { ProviderSecretEncryptionError } from "./provider-secret-encryption";

export class InvalidProviderCredentialError extends Data.TaggedError(
  "InvalidProviderCredentialError",
)<{
  cause?: unknown;
  message: string;
}> {}

export class ProviderUnavailableError extends Data.TaggedError(
  "ProviderUnavailableError",
)<{
  cause?: unknown;
  message: string;
}> {}

type ProviderConnectionError =
  | InvalidProviderCredentialError
  | ProviderSecretEncryptionError
  | ProviderUnavailableError;

type ProviderConnectionErrorTag = ProviderConnectionError["_tag"];
type ProviderConnectionOrpcCode =
  | "BAD_GATEWAY"
  | "BAD_REQUEST"
  | "INTERNAL_SERVER_ERROR";

const providerConnectionErrorMap = {
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

export async function runProviderConnectionEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Promise<A> {
  const exit = await Effect.runPromiseExit(
    effect as Effect.Effect<A, E, never>,
  );

  if (Exit.isSuccess(exit)) {
    return exit.value;
  }

  const failure = Option.getOrUndefined(Cause.failureOption(exit.cause));

  throw toProviderConnectionOrpcError(failure ?? exit.cause);
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
