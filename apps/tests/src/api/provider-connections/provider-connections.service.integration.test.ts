import {
  listHeartRateZones,
  seedHeartRateZonesIfEmpty,
} from "@korex/api/modules/heart-rate-zones/heart-rate-zones.repository";
import {
  getIntervalsIcuProviderConnectionForUser,
  upsertIntervalsIcuProviderConnection,
} from "@korex/api/modules/provider-connections/provider-connections.repository";
import { createProviderConnectionsModule } from "@korex/api/modules/provider-connections/provider-connections.service";
import {
  type IntervalsIcuAthleteProfile,
  IntervalsIcuClientError,
  type IntervalsIcuClientService,
} from "@korex/integrations/intervals-icu/client";
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

    const connection = await createProviderConnectionsTestModule({
      getAthleteProfile: async () => athleteProfile,
    }).connectIntervalsIcu({
      apiKey: "valid-api-key",
      userId: userDataExtensions.HughJass.id,
    });

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
    await expect(
      createProviderConnectionsTestModule({
        getAthleteProfile: async () => {
          throw new IntervalsIcuClientError({
            message: "Unauthorized",
            status: 401,
          });
        },
      }).connectIntervalsIcu({
        apiKey: "invalid-api-key",
        userId: userDataExtensions.HughJass.id,
      }),
    ).rejects.toMatchObject({ _tag: "InvalidProviderCredentialError" });
    await expect(
      getIntervalsIcuProviderConnectionForUser(userDataExtensions.HughJass.id),
    ).resolves.toBeNull();
  });

  it("reports provider failures separately from invalid credentials", async () => {
    await expect(
      createProviderConnectionsTestModule({
        getAthleteProfile: async () => {
          throw new IntervalsIcuClientError({
            message: "Bad gateway",
            status: 502,
          });
        },
      }).connectIntervalsIcu({
        apiKey: "valid-api-key",
        userId: userDataExtensions.HughJass.id,
      }),
    ).rejects.toMatchObject({ _tag: "ProviderUnavailableError" });
  });
});

function createProviderConnectionsTestModule(
  overrides: Partial<IntervalsIcuClientService>,
) {
  return createProviderConnectionsModule({
    encryptProviderSecret: async () => "encrypted-api-key",
    intervalsIcuClient: {
      getActivityDetail: async () => {
        throw new Error("unused");
      },
      getActivityMap: async () => {
        throw new Error("unused");
      },
      getActivityStreams: async () => {
        throw new Error("unused");
      },
      getAthleteProfile: async () => {
        throw new Error("unused");
      },
      listActivities: async () => {
        throw new Error("unused");
      },
      ...overrides,
    },
    seedHeartRateZonesIfEmpty,
    upsertIntervalsIcuProviderConnection,
  });
}
