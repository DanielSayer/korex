import { z } from "zod";

const heartRateZoneInput = z.object({
  maxBpm: z.number().int().positive().nullable(),
  minBpm: z.number().int().nonnegative(),
  name: z.string().trim().min(1).max(60),
  position: z.number().int().positive(),
});

export const replaceHeartRateZonesInput = z
  .object({
    zones: z.array(heartRateZoneInput).max(12),
  })
  .superRefine(({ zones }, context) => {
    const positions = new Set<number>();

    for (const zone of zones) {
      if (positions.has(zone.position)) {
        context.addIssue({
          code: "custom",
          message: "Heart Rate Zone positions must be unique",
          path: ["zones"],
        });
      }
      positions.add(zone.position);

      if (zone.maxBpm !== null && zone.maxBpm <= zone.minBpm) {
        context.addIssue({
          code: "custom",
          message: "Heart Rate Zone max BPM must be greater than min BPM",
          path: ["zones"],
        });
      }
    }

    const sortedZones = [...zones].sort((left, right) => {
      return left.position - right.position;
    });

    for (let index = 1; index < sortedZones.length; index += 1) {
      const previousZone = sortedZones[index - 1];
      const zone = sortedZones[index];

      if (!previousZone || !zone) {
        continue;
      }

      if (previousZone.maxBpm === null) {
        context.addIssue({
          code: "custom",
          message:
            "Only the final Heart Rate Zone can have an open upper bound",
          path: ["zones"],
        });
        continue;
      }

      if (zone.minBpm < previousZone.maxBpm) {
        context.addIssue({
          code: "custom",
          message: "Heart Rate Zones must not overlap",
          path: ["zones"],
        });
      }
    }
  });
