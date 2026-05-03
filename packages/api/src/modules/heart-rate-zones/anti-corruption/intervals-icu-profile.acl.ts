import type { IntervalsIcuAthleteProfile } from "@korex/integrations/intervals-icu/client";
import type { HeartRateZoneSeedInput } from "../heart-rate-zones.types";

export function toHeartRateZoneSeedInputsFromIntervalsIcuProfile(
  profile: IntervalsIcuAthleteProfile,
): HeartRateZoneSeedInput[] {
  const sportsSettings = profile.sportsSettings?.[0];
  const hrZones = sportsSettings?.hr_zones;
  const hrZoneNames = sportsSettings?.hr_zone_names;

  if (!hrZones?.length || !hrZoneNames?.length) {
    return [];
  }

  return hrZones.flatMap((maxBpm, index) => {
    const name = hrZoneNames[index];
    const previousMaxBpm = hrZones[index - 1];

    if (!name) {
      return [];
    }

    return {
      name,
      position: index + 1,
      range: {
        maxBpm,
        minBpm: previousMaxBpm ?? 0,
      },
    };
  });
}
