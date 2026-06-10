import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../index";
import { getNextTrainingWeekStartAt } from "../activities/weekly-training-summaries/training-week";
import {
  createTrainingNoteInput,
  deleteTrainingNoteInput,
  listTrainingNotesForActivityInput,
  listTrainingNotesForTrainingWeekInput,
  updateTrainingNoteInput,
} from "./training-notes.inputs";
import {
  listActivityTrainingNotesForTrainingWeek,
  listRecentTrainingNotes,
  listTrainingNotesForActivity,
  listTrainingNotesForTrainingWeek,
} from "./training-notes.repository";
import {
  createTrainingNote,
  deleteTrainingNote,
  updateTrainingNote,
} from "./training-notes.service";
import {
  TrainingNoteNotFoundError,
  TrainingNoteTargetError,
  TrainingNoteTextError,
} from "./training-notes.types";

export const trainingNotesRouter = {
  activityNotesForTrainingWeek: protectedProcedure
    .input(listTrainingNotesForTrainingWeekInput)
    .handler(async ({ context, input }) => {
      return listActivityTrainingNotesForTrainingWeek({
        userId: context.session.user.id,
        weekEndAt: getNextTrainingWeekStartAt(input.weekStartAt),
        weekStartAt: input.weekStartAt,
      });
    }),
  create: protectedProcedure
    .input(createTrainingNoteInput)
    .handler(async ({ context, input }) => {
      try {
        return await createTrainingNote({
          activityId: input.activityId,
          text: input.text,
          userId: context.session.user.id,
          weekStartAt: input.weekStartAt,
        });
      } catch (error) {
        throw toTrainingNoteOrpcError(error);
      }
    }),
  delete: protectedProcedure
    .input(deleteTrainingNoteInput)
    .handler(async ({ context, input }) => {
      try {
        return await deleteTrainingNote({
          id: input.id,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toTrainingNoteOrpcError(error);
      }
    }),
  listForActivity: protectedProcedure
    .input(listTrainingNotesForActivityInput)
    .handler(async ({ context, input }) => {
      return listTrainingNotesForActivity({
        activityId: input.activityId,
        userId: context.session.user.id,
      });
    }),
  listForTrainingWeek: protectedProcedure
    .input(listTrainingNotesForTrainingWeekInput)
    .handler(async ({ context, input }) => {
      return listTrainingNotesForTrainingWeek({
        userId: context.session.user.id,
        weekStartAt: input.weekStartAt,
      });
    }),
  recent: protectedProcedure.handler(async ({ context }) => {
    return listRecentTrainingNotes({
      userId: context.session.user.id,
    });
  }),
  update: protectedProcedure
    .input(updateTrainingNoteInput)
    .handler(async ({ context, input }) => {
      try {
        return await updateTrainingNote({
          id: input.id,
          text: input.text,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toTrainingNoteOrpcError(error);
      }
    }),
};

function toTrainingNoteOrpcError(error: unknown) {
  if (error instanceof TrainingNoteTargetError) {
    return new ORPCError("BAD_REQUEST", {
      message: error.message,
    });
  }

  if (error instanceof TrainingNoteTextError) {
    return new ORPCError("BAD_REQUEST", {
      message: error.message,
    });
  }

  if (error instanceof TrainingNoteNotFoundError) {
    return new ORPCError("NOT_FOUND", {
      message: error.message,
    });
  }

  return error;
}
