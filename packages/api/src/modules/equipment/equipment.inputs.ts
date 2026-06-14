import { z } from "zod";

const equipmentType = z.enum(["shoes"]);
const sportType = z.enum(["run", "treadmill", "hike"]);
const distanceMeters = z.number().finite().nonnegative();

export const createEquipmentInput = z.object({
  equipmentType,
  name: z.string().trim().min(1).max(120),
  retirementDistanceMeters: distanceMeters.nullable().optional(),
  startingDistanceMeters: distanceMeters.optional(),
});

export const updateEquipmentInput = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(120).optional(),
  retirementDistanceMeters: distanceMeters.nullable().optional(),
  startingDistanceMeters: distanceMeters.optional(),
});

export const equipmentIdInput = z.object({
  id: z.coerce.number().int().positive(),
});

export const setDefaultEquipmentInput = z.object({
  equipmentId: z.coerce.number().int().positive(),
  sportType,
});

export const clearDefaultEquipmentInput = z.object({
  equipmentType,
  sportType,
});

export const assignActivityEquipmentInput = z.object({
  activityId: z.coerce.number().int().positive(),
  equipmentId: z.coerce.number().int().positive(),
});

export const removeActivityEquipmentUseInput = z.object({
  activityId: z.coerce.number().int().positive(),
  equipmentType,
});

export const bulkAssignEquipmentInput = z
  .object({
    endAt: z.coerce.date(),
    equipmentId: z.coerce.number().int().positive(),
    sportType,
    startAt: z.coerce.date(),
    unassignedOnly: z.boolean().default(true),
  })
  .refine((input) => input.endAt > input.startAt, {
    message: "End date must be after start date",
    path: ["endAt"],
  });
