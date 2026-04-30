import { Effect, Layer } from "effect";
import { ActiveProviderConnectionNotFoundError } from "./provider-connections.errors";
import { getActiveProviderConnectionForUser } from "./provider-connections.repository";
import { decryptProviderSecret } from "./provider-secret-encryption";
import {
  type Provider,
  ProviderSessionContext,
} from "./provider-session";

export const ProviderSessionLive = Layer.succeed(ProviderSessionContext, {
  getActiveProviderSession,
});

export function getActiveProviderSession({
  provider,
  userId,
}: {
  provider: Provider;
  userId: string;
}) {
  return Effect.gen(function* () {
    const connection = yield* Effect.promise(() =>
      getActiveProviderConnectionForUser({ provider, userId }),
    );

    if (!connection) {
      return yield* Effect.fail(
        new ActiveProviderConnectionNotFoundError({
          message: "Active provider connection not found",
        }),
      );
    }

    const apiKey = yield* decryptProviderSecret(connection.authSecretEncrypted);

    return {
      apiKey,
      authType: "basic" as const,
      provider: connection.provider,
      providerUserId: connection.providerUserId,
    };
  });
}
