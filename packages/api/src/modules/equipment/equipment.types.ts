import type { SportType } from "../activities/activities.types";

export type EquipmentType = "shoes";

export type Equipment = {
  activityCount: number;
  createdAt: Date;
  equipmentType: EquipmentType;
  id: number;
  name: string;
  retiredAt: Date | null;
  retirementDistanceMeters: number | null;
  startingDistanceMeters: number;
  updatedAt: Date;
  usageDistanceMeters: number;
  userId: string;
};

export type ActivityEquipmentUse = {
  activityId: number;
  createdAt: Date;
  equipmentId: number;
  equipmentType: EquipmentType;
  id: number;
  updatedAt: Date;
  userId: string;
};

export type ActivityEquipmentUseSummary = ActivityEquipmentUse & {
  equipmentName: string;
};

export type DefaultEquipment = {
  createdAt: Date;
  equipmentId: number;
  equipmentType: EquipmentType;
  id: number;
  sportType: SportType;
  updatedAt: Date;
  userId: string;
};

export type CreateEquipmentInput = {
  equipmentType: EquipmentType;
  name: string;
  retirementDistanceMeters?: number | null;
  startingDistanceMeters?: number;
  userId: string;
};

export type UpdateEquipmentInput = {
  id: number;
  name?: string;
  retirementDistanceMeters?: number | null;
  startingDistanceMeters?: number;
  userId: string;
};

export type RetireEquipmentInput = {
  id: number;
  now?: Date;
  userId: string;
};

export type RestoreEquipmentInput = {
  id: number;
  userId: string;
};

export type SetDefaultEquipmentInput = {
  equipmentId: number;
  sportType: SportType;
  userId: string;
};

export type ClearDefaultEquipmentInput = {
  equipmentType: EquipmentType;
  sportType: SportType;
  userId: string;
};

export type AssignActivityEquipmentInput = {
  activityId: number;
  equipmentId: number;
  userId: string;
};

export type RemoveActivityEquipmentUseInput = {
  activityId: number;
  equipmentType: EquipmentType;
  userId: string;
};

export type BulkAssignEquipmentInput = {
  endAt: Date;
  equipmentId: number;
  sportType: SportType;
  startAt: Date;
  unassignedOnly: boolean;
  userId: string;
};

export class EquipmentNotFoundError extends Error {
  constructor() {
    super("Equipment was not found");
    this.name = "EquipmentNotFoundError";
  }
}

export class EquipmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EquipmentValidationError";
  }
}

export class ActivityEquipmentUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivityEquipmentUseError";
  }
}
