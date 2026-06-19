import {
  listHeartRateZones,
  replaceHeartRateZones,
  seedHeartRateZonesIfEmpty,
} from "@korex/api/modules/heart-rate-zones/heart-rate-zones.repository";
import { describe, expect, it } from "vitest";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { HeartRateZoneBuilder } from "../../setup/integration/test-data/heart-rate-zone-builder";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("Heart Rate Zones repository", () => {
  it("lists a user's Heart Rate Zones by position", async () => {
    const threshold = HeartRateZoneBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withId(1002)
      .withName("Threshold")
      .withPosition(2)
      .withMinBpm(160)
      .withMaxBpm(180)
      .build();
    const easy = HeartRateZoneBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();

    await DataSeedAsync.withHeartRateZones(threshold, easy).seedAsync();

    await expect(
      listHeartRateZones({ userId: userDataExtensions.HughJass.id }),
    ).resolves.toEqual([
      {
        id: easy.id,
        maxBpm: easy.maxBpm,
        minBpm: easy.minBpm,
        name: easy.name,
        position: easy.position,
      },
      {
        id: threshold.id,
        maxBpm: threshold.maxBpm,
        minBpm: threshold.minBpm,
        name: threshold.name,
        position: threshold.position,
      },
    ]);
  });

  it("replaces a user's active Heart Rate Zone set", async () => {
    const existing = HeartRateZoneBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();

    await DataSeedAsync.withHeartRateZones(existing).seedAsync();

    const zones = await replaceHeartRateZones({
      userId: userDataExtensions.HughJass.id,
      zones: [
        {
          maxBpm: 150,
          minBpm: 100,
          name: "Easy",
          position: 1,
        },
        {
          maxBpm: null,
          minBpm: 150,
          name: "Hard",
          position: 2,
        },
      ],
    });

    expect(zones).toEqual([
      expect.objectContaining({
        maxBpm: 150,
        minBpm: 100,
        name: "Easy",
        position: 1,
      }),
      expect.objectContaining({
        maxBpm: null,
        minBpm: 150,
        name: "Hard",
        position: 2,
      }),
    ]);
    expect(zones.map((zone) => zone.id)).not.toContain(existing.id);
  });

  it("seeds a user's Heart Rate Zones when none exist", async () => {
    const zones = await seedHeartRateZonesIfEmpty({
      userId: userDataExtensions.HughJass.id,
      zones: [
        {
          name: "Recovery",
          position: 1,
          range: { maxBpm: 153, minBpm: 0 },
        },
        {
          name: "Aerobic",
          position: 2,
          range: { maxBpm: 170, minBpm: 153 },
        },
      ],
    });

    expect(zones).toEqual([
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

  it("does not overwrite existing user Heart Rate Zones when seeding", async () => {
    const existing = HeartRateZoneBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();

    await DataSeedAsync.withHeartRateZones(existing).seedAsync();

    const zones = await seedHeartRateZonesIfEmpty({
      userId: userDataExtensions.HughJass.id,
      zones: [
        {
          name: "Provider Recovery",
          position: 1,
          range: { maxBpm: 153, minBpm: 0 },
        },
      ],
    });

    expect(zones).toEqual([
      {
        id: existing.id,
        maxBpm: existing.maxBpm,
        minBpm: existing.minBpm,
        name: existing.name,
        position: existing.position,
      },
    ]);
  });
});
