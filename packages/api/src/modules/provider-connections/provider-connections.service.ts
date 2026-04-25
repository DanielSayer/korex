import { IntervalsIcuClient } from "@korex/integrations/intervals-icu/client";
import { INTERVALS_ICU_BASIC_AUTH_USERNAME } from "@korex/integrations/intervals-icu/constants";
import { Effect } from "effect";
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
    const athleteProfile = yield* intervalsIcuClient.getAthleteProfile({
      apiKey,
    });
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
