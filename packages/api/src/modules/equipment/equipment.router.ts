import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../index";
import {
  assignActivityEquipmentInput,
  bulkAssignEquipmentInput,
  clearDefaultEquipmentInput,
  createEquipmentInput,
  equipmentIdInput,
  removeActivityEquipmentUseInput,
  setDefaultEquipmentInput,
  updateEquipmentInput,
} from "./equipment.inputs";
import { listDefaultEquipment, listEquipment } from "./equipment.repository";
import {
  assignActivityEquipment,
  bulkAssignEquipment,
  clearDefaultEquipment,
  createEquipment,
  removeActivityEquipmentUse,
  restoreEquipment,
  retireEquipment,
  setDefaultEquipment,
  updateEquipment,
} from "./equipment.service";
import {
  ActivityEquipmentUseError,
  EquipmentNotFoundError,
  EquipmentValidationError,
} from "./equipment.types";

export const equipmentRouter = {
  assignActivity: protectedProcedure
    .input(assignActivityEquipmentInput)
    .handler(async ({ context, input }) => {
      try {
        return await assignActivityEquipment({
          activityId: input.activityId,
          equipmentId: input.equipmentId,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toEquipmentOrpcError(error);
      }
    }),
  bulkAssign: protectedProcedure
    .input(bulkAssignEquipmentInput)
    .handler(async ({ context, input }) => {
      try {
        return await bulkAssignEquipment({
          endAt: input.endAt,
          equipmentId: input.equipmentId,
          sportType: input.sportType,
          startAt: input.startAt,
          unassignedOnly: input.unassignedOnly,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toEquipmentOrpcError(error);
      }
    }),
  clearDefault: protectedProcedure
    .input(clearDefaultEquipmentInput)
    .handler(async ({ context, input }) => {
      return clearDefaultEquipment({
        equipmentType: input.equipmentType,
        sportType: input.sportType,
        userId: context.session.user.id,
      });
    }),
  create: protectedProcedure
    .input(createEquipmentInput)
    .handler(async ({ context, input }) => {
      try {
        return await createEquipment({
          equipmentType: input.equipmentType,
          name: input.name,
          retirementDistanceMeters: input.retirementDistanceMeters,
          startingDistanceMeters: input.startingDistanceMeters,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toEquipmentOrpcError(error);
      }
    }),
  defaults: protectedProcedure.handler(async ({ context }) => {
    return listDefaultEquipment({ userId: context.session.user.id });
  }),
  list: protectedProcedure.handler(async ({ context }) => {
    return listEquipment({ userId: context.session.user.id });
  }),
  removeActivityUse: protectedProcedure
    .input(removeActivityEquipmentUseInput)
    .handler(async ({ context, input }) => {
      return removeActivityEquipmentUse({
        activityId: input.activityId,
        equipmentType: input.equipmentType,
        userId: context.session.user.id,
      });
    }),
  restore: protectedProcedure
    .input(equipmentIdInput)
    .handler(async ({ context, input }) => {
      try {
        return await restoreEquipment({
          id: input.id,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toEquipmentOrpcError(error);
      }
    }),
  retire: protectedProcedure
    .input(equipmentIdInput)
    .handler(async ({ context, input }) => {
      try {
        return await retireEquipment({
          id: input.id,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toEquipmentOrpcError(error);
      }
    }),
  setDefault: protectedProcedure
    .input(setDefaultEquipmentInput)
    .handler(async ({ context, input }) => {
      try {
        return await setDefaultEquipment({
          equipmentId: input.equipmentId,
          sportType: input.sportType,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toEquipmentOrpcError(error);
      }
    }),
  update: protectedProcedure
    .input(updateEquipmentInput)
    .handler(async ({ context, input }) => {
      try {
        return await updateEquipment({
          id: input.id,
          name: input.name,
          retirementDistanceMeters: input.retirementDistanceMeters,
          startingDistanceMeters: input.startingDistanceMeters,
          userId: context.session.user.id,
        });
      } catch (error) {
        throw toEquipmentOrpcError(error);
      }
    }),
};

function toEquipmentOrpcError(error: unknown) {
  if (error instanceof EquipmentNotFoundError) {
    return new ORPCError("NOT_FOUND", { message: error.message });
  }

  if (
    error instanceof EquipmentValidationError ||
    error instanceof ActivityEquipmentUseError
  ) {
    return new ORPCError("BAD_REQUEST", { message: error.message });
  }

  return error;
}
