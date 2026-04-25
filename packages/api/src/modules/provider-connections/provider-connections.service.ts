import {
  IntervalsIcuClient,
  type IntervalsIcuClientError,
} from "@korex/integrations/intervals-icu/client";
import { INTERVALS_ICU_BASIC_AUTH_USERNAME } from "@korex/integrations/intervals-icu/constants";
import { Effect } from "effect";
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

export function connectIntervalsIcu({
  apiKey,
  userId,
}: ConnectIntervalsIcuInput) {
  return Effect.gen(function* () {
    const intervalsIcuClient = yield* IntervalsIcuClient;
    const athleteProfile = yield* intervalsIcuClient
      .getAthleteProfile({
        apiKey,
      })
      .pipe(Effect.mapError(mapIntervalsIcuClientError));
    const encryptedApiKey = yield* encryptProviderSecret(apiKey);

    return yield* Effect.promise(() =>
      upsertIntervalsIcuProviderConnection({
        authSecretEncrypted: encryptedApiKey,
        authUsername: INTERVALS_ICU_BASIC_AUTH_USERNAME,
        metadata: athleteProfile,
        providerUserId: athleteProfile.id,
        providerUserName: athleteProfile.name ?? null,
        userId,
      }),
    );
  });
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
