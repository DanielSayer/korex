import { ActiveProviderConnectionNotFoundError } from "./provider-connections.errors";
import {
  getActiveProviderConnectionForUser,
  getActiveProviderConnectionForUserId,
} from "./provider-connections.repository";
import { decryptProviderSecret } from "./provider-secret-encryption";
import type { Provider, ProviderSessionService } from "./provider-session";

type ProviderSessionDependencies = {
  decryptProviderSecret: typeof decryptProviderSecret;
  getActiveProviderConnectionForUser: typeof getActiveProviderConnectionForUser;
  getActiveProviderConnectionForUserId: typeof getActiveProviderConnectionForUserId;
};

export function createProviderSessionModule(
  dependencies: ProviderSessionDependencies,
): ProviderSessionService {
  return {
    getActiveProviderSession: (input) =>
      getActiveProviderSession(input, dependencies),
    getActiveProviderSessionForUser: (input) =>
      getActiveProviderSessionForUser(input, dependencies),
  };
}

export const providerSessionModule = createProviderSessionModule({
  decryptProviderSecret,
  getActiveProviderConnectionForUser,
  getActiveProviderConnectionForUserId,
});

async function getActiveProviderSession(
  { provider, userId }: { provider: Provider; userId: string },
  dependencies: ProviderSessionDependencies,
) {
  const connection = await dependencies.getActiveProviderConnectionForUser({
    provider,
    userId,
  });

  if (!connection) {
    throw new ActiveProviderConnectionNotFoundError({
      message: "Active provider connection not found",
    });
  }

  const apiKey = await dependencies.decryptProviderSecret(
    connection.authSecretEncrypted,
  );

  return {
    apiKey,
    authType: "basic" as const,
    connectionId: connection.id,
    provider: connection.provider,
    providerUserId: connection.providerUserId,
  };
}

async function getActiveProviderSessionForUser(
  { userId }: { userId: string },
  dependencies: ProviderSessionDependencies,
) {
  const connection =
    await dependencies.getActiveProviderConnectionForUserId(userId);

  if (!connection) {
    throw new ActiveProviderConnectionNotFoundError({
      message: "Active provider connection not found",
    });
  }

  const apiKey = await dependencies.decryptProviderSecret(
    connection.authSecretEncrypted,
  );

  return {
    apiKey,
    authType: "basic" as const,
    connectionId: connection.id,
    provider: connection.provider,
    providerUserId: connection.providerUserId,
  };
}
