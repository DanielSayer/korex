import { listHeartRateZones } from "@korex/api/modules/heart-rate-zones/heart-rate-zones.repository";
import { getIntervalsIcuProviderConnectionForUser } from "@korex/api/modules/provider-connections/provider-connections.repository";
import { connectIntervalsIcu } from "@korex/api/modules/provider-connections/provider-connections.service";
import {
  IntervalsIcuClient,
  type IntervalsIcuAthleteProfile,
  IntervalsIcuClientError,
  type IntervalsIcuClientService,
} from "@korex/integrations/intervals-icu/client";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("provider connections service", () => {
  it("connects a verified Intervals.icu athlete and seeds their heart rate zones", async () => {
    const athleteProfile = {
      id: "athlete-1",
      name: "Integration Athlete",
      sportSettings: [
        {
          hr_zone_names: ["Recovery", "Aerobic"],
          hr_zones: [153, 170],
        },
      ],
    } satisfies IntervalsIcuAthleteProfile;

    const connection = await Effect.runPromise(
      connectIntervalsIcu({
        apiKey: "valid-api-key",
        userId: userDataExtensions.HughJass.id,
      }).pipe(
        Effect.provide(
          createIntervalsIcuClientLayer({
            getAthleteProfile: () => Effect.succeed(athleteProfile),
          }),
        ),
      ),
    );

    expect(connection).toMatchObject({
      provider: "intervals_icu",
      providerUserId: athleteProfile.id,
      providerUserName: athleteProfile.name,
      status: "active",
    });
    await expect(
      listHeartRateZones({ userId: userDataExtensions.HughJass.id }),
    ).resolves.toEqual([
      expect.objectContaining({
        maxBpm: 153,
        minBpm: 0,
        name: "Recovery",
        position: 1,
      }),
      expect.objectContaining({
        maxBpm: 170,
        minBpm: 153,
        name: "Aerobic",
        position: 2,
      }),
    ]);
  });

  it("rejects an invalid API key without creating a provider connection", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        connectIntervalsIcu({
          apiKey: "invalid-api-key",
          userId: userDataExtensions.HughJass.id,
        }).pipe(
          Effect.provide(
            createIntervalsIcuClientLayer({
              getAthleteProfile: () =>
                Effect.fail(
                  new IntervalsIcuClientError({
                    message: "Unauthorized",
                    status: 401,
                  }),
                ),
            }),
          ),
        ),
      ),
    );

    expect(result).toMatchObject({
      _tag: "Left",
      left: {
        _tag: "InvalidProviderCredentialError",
      },
    });
    await expect(
      getIntervalsIcuProviderConnectionForUser(
        userDataExtensions.HughJass.id,
      ),
    ).resolves.toBeNull();
  });

  it("reports provider failures separately from invalid credentials", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        connectIntervalsIcu({
          apiKey: "valid-api-key",
          userId: userDataExtensions.HughJass.id,
        }).pipe(
          Effect.provide(
            createIntervalsIcuClientLayer({
              getAthleteProfile: () =>
                Effect.fail(
                  new IntervalsIcuClientError({
                    message: "Bad gateway",
                    status: 502,
                  }),
                ),
            }),
          ),
        ),
      ),
    );

    expect(result).toMatchObject({
      _tag: "Left",
      left: {
        _tag: "ProviderUnavailableError",
      },
    });
  });
});

function createIntervalsIcuClientLayer(
  overrides: Partial<IntervalsIcuClientService>,
) {
  return Layer.succeed(IntervalsIcuClient, {
    getActivityDetail: () => Effect.die("unused"),
    getActivityMap: () => Effect.die("unused"),
    getActivityStreams: () => Effect.die("unused"),
    getAthleteProfile: () => Effect.die("unused"),
    listActivities: () => Effect.die("unused"),
    ...overrides,
  } as IntervalsIcuClientService);
}
