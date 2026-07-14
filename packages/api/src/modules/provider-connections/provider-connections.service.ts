import type {
  IntervalsIcuAthleteProfile,
  IntervalsIcuClientError,
  IntervalsIcuClientService,
} from "@korex/integrations/intervals-icu/client";
import { INTERVALS_ICU_BASIC_AUTH_USERNAME } from "@korex/integrations/intervals-icu/constants";
import { intervalsIcuClient } from "@korex/integrations/intervals-icu/live";
import { toHeartRateZoneSeedInputsFromIntervalsIcuProfile } from "../heart-rate-zones/anti-corruption/intervals-icu-profile.acl";
import { seedHeartRateZonesIfEmpty } from "../heart-rate-zones/heart-rate-zones.repository";
import {
  InvalidProviderCredentialError,
  ProviderUnavailableError,
} from "./provider-connections.errors";
import { upsertIntervalsIcuProviderConnection } from "./provider-connections.repository";
import { encryptProviderSecret } from "./provider-secret-encryption";

export type ConnectIntervalsIcuInput = {
  userId: string;
  apiKey: string;
};

export type ProviderConnectionsModule = {
  connectIntervalsIcu: (
    input: ConnectIntervalsIcuInput,
  ) => ReturnType<typeof connectIntervalsIcu>;
};

type ProviderConnectionsDependencies = {
  encryptProviderSecret: typeof encryptProviderSecret;
  intervalsIcuClient: IntervalsIcuClientService;
  seedHeartRateZonesIfEmpty: typeof seedHeartRateZonesIfEmpty;
  upsertIntervalsIcuProviderConnection: typeof upsertIntervalsIcuProviderConnection;
};

export function createProviderConnectionsModule(
  dependencies: ProviderConnectionsDependencies,
): ProviderConnectionsModule {
  return {
    connectIntervalsIcu: (input) => connectIntervalsIcu(input, dependencies),
  };
}

export const providerConnectionsModule = createProviderConnectionsModule({
  encryptProviderSecret,
  intervalsIcuClient,
  seedHeartRateZonesIfEmpty,
  upsertIntervalsIcuProviderConnection,
});

async function connectIntervalsIcu(
  { apiKey, userId }: ConnectIntervalsIcuInput,
  dependencies: ProviderConnectionsDependencies,
) {
  let athleteProfile: IntervalsIcuAthleteProfile;
  try {
    athleteProfile = await dependencies.intervalsIcuClient.getAthleteProfile({
      apiKey,
    });
  } catch (cause) {
    throw mapIntervalsIcuClientError(cause as IntervalsIcuClientError);
  }
  const encryptedApiKey = await dependencies.encryptProviderSecret(apiKey);

  const providerConnection =
    await dependencies.upsertIntervalsIcuProviderConnection({
      authSecretEncrypted: encryptedApiKey,
      authUsername: INTERVALS_ICU_BASIC_AUTH_USERNAME,
      metadata: athleteProfile,
      providerUserId: athleteProfile.id,
      providerUserName: athleteProfile.name ?? null,
      userId,
    });

  await dependencies.seedHeartRateZonesIfEmpty({
    userId,
    zones: toHeartRateZoneSeedInputsFromIntervalsIcuProfile(athleteProfile),
  });

  return providerConnection;
}

function mapIntervalsIcuClientError(cause: IntervalsIcuClientError) {
  if (cause.status === 401 || cause.status === 403) {
    return new InvalidProviderCredentialError({
      cause,
      message: "Intervals.icu rejected the supplied API key",
    });
  }

  return new ProviderUnavailableError({
    cause,
    message: "Failed to verify Intervals.icu API key",
  });
}
