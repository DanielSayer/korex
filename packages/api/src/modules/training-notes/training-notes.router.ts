import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../index";
import { getNextTrainingWeekStartAt } from "../activities/weekly-training-summaries/training-week";
import {
  archiveTrainingNoteTagInput,
  createTrainingNoteInput,
  createTrainingNoteTagInput,
  deleteTrainingNoteInput,
  listTrainingNotesForActivityInput,
  listTrainingNotesForTrainingWeekInput,
  restoreTrainingNoteTagInput,
  updateTrainingNoteInput,
  updateTrainingNoteTagInput,
} from "./training-notes.inputs";
import {
  listActivityTrainingNotesForTrainingWeek,
  listRecentTrainingNotes,
  listTrainingNotesForActivity,
  listTrainingNotesForTrainingWeek,
  listTrainingNoteTags,
} from "./training-notes.repository";
import {
  archiveTrainingNoteTag,
  createTrainingNote,
  createTrainingNoteTag,
  deleteTrainingNote,
  restoreTrainingNoteTag,
  updateTrainingNote,
  updateTrainingNoteTag,
} from "./training-notes.service";
import {
  TrainingNoteNotFoundError,
  TrainingNoteTagError,
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
          tagIds: input.tagIds,
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
  tags: protectedProcedure.handler(async ({ context }) => {
    return listTrainingNoteTags({
      includeArchived: true,
      userId: context.session.user.id,
    });
  }),
  createTag: protectedProcedure
    .input(createTrainingNoteTagInput)
    .handler(async ({ context, input }) => {
      try {
        return await createTrainingNoteTag({
          color: input.color,
          name: input.name,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toTrainingNoteOrpcError(error);
      }
    }),
  updateTag: protectedProcedure
    .input(updateTrainingNoteTagInput)
    .handler(async ({ context, input }) => {
      try {
        return await updateTrainingNoteTag({
          color: input.color,
          id: input.id,
          name: input.name,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toTrainingNoteOrpcError(error);
      }
    }),
  archiveTag: protectedProcedure
    .input(archiveTrainingNoteTagInput)
    .handler(async ({ context, input }) => {
      try {
        return await archiveTrainingNoteTag({
          id: input.id,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toTrainingNoteOrpcError(error);
      }
    }),
  restoreTag: protectedProcedure
    .input(restoreTrainingNoteTagInput)
    .handler(async ({ context, input }) => {
      try {
        return await restoreTrainingNoteTag({
          id: input.id,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toTrainingNoteOrpcError(error);
      }
    }),
  update: protectedProcedure
    .input(updateTrainingNoteInput)
    .handler(async ({ context, input }) => {
      try {
        return await updateTrainingNote({
          id: input.id,
          tagIds: input.tagIds,
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

  if (error instanceof TrainingNoteTagError) {
    return new ORPCError("BAD_REQUEST", {
      message: error.message,
    });
  }

  return error;
}
