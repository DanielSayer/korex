import { toHeartRateZoneSeedInputsFromIntervalsIcuProfile } from "@korex/api/modules/heart-rate-zones/anti-corruption/intervals-icu-profile.acl";
import { describe, expect, it } from "vitest";

describe("Intervals.icu profile heart-rate zone ACL", () => {
  it("maps the first sports settings heart-rate zones to seed inputs", () => {
    const zones = toHeartRateZoneSeedInputsFromIntervalsIcuProfile({
      id: "athlete-1",
      sportsSettings: [
        {
          hr_zone_names: [
            "Recovery",
            "Aerobic",
            "Tempo",
            "SubThreshold",
            "SuperThreshold",
            "Aerobic Capacity",
            "Anaerobic",
          ],
          hr_zones: [153, 170, 178, 190, 195, 201, 210],
        },
      ],
    });

    expect(zones).toEqual([
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
      {
        name: "Tempo",
        position: 3,
        range: { maxBpm: 178, minBpm: 170 },
      },
      {
        name: "SubThreshold",
        position: 4,
        range: { maxBpm: 190, minBpm: 178 },
      },
      {
        name: "SuperThreshold",
        position: 5,
        range: { maxBpm: 195, minBpm: 190 },
      },
      {
        name: "Aerobic Capacity",
        position: 6,
        range: { maxBpm: 201, minBpm: 195 },
      },
      {
        name: "Anaerobic",
        position: 7,
        range: { maxBpm: 210, minBpm: 201 },
      },
    ]);
  });

  it("returns no seed inputs when sports settings do not include usable heart-rate zones", () => {
    expect(
      toHeartRateZoneSeedInputsFromIntervalsIcuProfile({ id: "athlete-1" }),
    ).toEqual([]);
    expect(
      toHeartRateZoneSeedInputsFromIntervalsIcuProfile({
        id: "athlete-1",
        sportsSettings: [{ hr_zone_names: ["Recovery"], hr_zones: [] }],
      }),
    ).toEqual([]);
  });
});
