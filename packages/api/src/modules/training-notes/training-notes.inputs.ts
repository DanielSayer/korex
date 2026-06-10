import { z } from "zod";

export const trainingNoteTextMaxLength = 2000;

const trainingNoteTextInput = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1).max(trainingNoteTextMaxLength));

export const listTrainingNotesForActivityInput = z.object({
  activityId: z.coerce.number().int().positive(),
});

export const listTrainingNotesForTrainingWeekInput = z.object({
  weekStartAt: z.coerce.date(),
});

export const createTrainingNoteInput = z
  .object({
    activityId: z.coerce.number().int().positive().optional(),
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
  text: trainingNoteTextInput,
});

export const deleteTrainingNoteInput = z.object({
  id: z.coerce.number().int().positive(),
});
