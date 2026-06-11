import { z } from "zod";
import { trainingNoteTagColors } from "./training-notes.types";

export const trainingNoteTextMaxLength = 2000;

const trainingNoteTextInput = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().max(trainingNoteTextMaxLength));

const trainingNoteTagIdsInput = z
  .array(z.coerce.number().int().positive())
  .max(20)
  .default([]);

const trainingNoteTagNameInput = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(1)
      .max(32)
      .regex(/^[\p{L}\p{N} _-]+$/u, {
        message:
          "Training Note Tag name can contain letters, numbers, spaces, hyphens, and underscores.",
      }),
  );

export const listTrainingNotesForActivityInput = z.object({
  activityId: z.coerce.number().int().positive(),
});

export const listTrainingNotesForTrainingWeekInput = z.object({
  weekStartAt: z.coerce.date(),
});

export const createTrainingNoteInput = z
  .object({
    activityId: z.coerce.number().int().positive().optional(),
    tagIds: trainingNoteTagIdsInput,
    text: trainingNoteTextInput,
    weekStartAt: z.coerce.date().optional(),
  })
  .refine(
    (input) =>
      (input.activityId !== undefined && input.weekStartAt === undefined) ||
      (input.activityId === undefined && input.weekStartAt !== undefined),
    {
      message: "Training Note must have exactly one target.",
      path: ["activityId"],
    },
  );

export const updateTrainingNoteInput = z.object({
  id: z.coerce.number().int().positive(),
  tagIds: trainingNoteTagIdsInput,
  text: trainingNoteTextInput,
});

export const deleteTrainingNoteInput = z.object({
  id: z.coerce.number().int().positive(),
});

export const createTrainingNoteTagInput = z.object({
  color: z.enum(trainingNoteTagColors),
  name: trainingNoteTagNameInput,
});

export const updateTrainingNoteTagInput = z.object({
  color: z.enum(trainingNoteTagColors),
  id: z.coerce.number().int().positive(),
  name: trainingNoteTagNameInput,
});

export const archiveTrainingNoteTagInput = z.object({
  id: z.coerce.number().int().positive(),
});

export const restoreTrainingNoteTagInput = z.object({
  id: z.coerce.number().int().positive(),
});
