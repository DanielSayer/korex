import { Context, type Effect } from "effect";
import type { ActiveProviderConnectionNotFoundError } from "./provider-connections.errors";
import type { ProviderSecretEncryptionError } from "./provider-secret-encryption";

export type Provider = "intervals_icu";

export type ProviderSession = {
  apiKey: string;
  authType: "basic";
  provider: "intervals_icu";
  providerUserId: string;
};

export type ProviderSessionService = {
  getActiveProviderSession: (input: {
    provider: Provider;
    userId: string;
  }) => Effect.Effect<
    ProviderSession,
    ActiveProviderConnectionNotFoundError | ProviderSecretEncryptionError
  >;
};

export class ProviderSessionContext extends Context.Tag(
  "ProviderSessionContext",
)<ProviderSessionContext, ProviderSessionService>() {}
