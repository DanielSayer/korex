import type { SportType } from "../activities/activities.types";
import {
  assignDefaultEquipmentForActivity,
  bulkAssignEquipmentToActivities,
  clearDefaultEquipmentForEquipmentRecord,
  clearDefaultEquipmentRecord,
  createEquipmentRecord,
  findActivityForEquipmentAssignment,
  findEquipmentForAssignment,
  getEquipment,
  removeActivityEquipmentUseRecord,
  restoreEquipmentRecord,
  retireEquipmentRecord,
  setDefaultEquipmentRecord,
  transaction,
  updateEquipmentRecord,
  upsertActivityEquipmentUse,
} from "./equipment.repository";
import type {
  AssignActivityEquipmentInput,
  BulkAssignEquipmentInput,
  ClearDefaultEquipmentInput,
  CreateEquipmentInput,
  RemoveActivityEquipmentUseInput,
  RestoreEquipmentInput,
  RetireEquipmentInput,
  SetDefaultEquipmentInput,
  UpdateEquipmentInput,
} from "./equipment.types";
import {
  ActivityEquipmentUseError,
  EquipmentNotFoundError,
  EquipmentValidationError,
} from "./equipment.types";

export async function createEquipment({
  equipmentType,
  name,
  retirementDistanceMeters = null,
  startingDistanceMeters = 0,
  userId,
}: CreateEquipmentInput) {
  assertValidDistance(startingDistanceMeters, "Equipment Starting Distance");
  assertOptionalDistance(
    retirementDistanceMeters,
    "Equipment Retirement Distance",
  );

  return createEquipmentRecord({
    equipmentType,
    name,
    retirementDistanceMeters,
    startingDistanceMeters,
    userId,
  });
}

export async function updateEquipment({
  id,
  name,
  retirementDistanceMeters,
  startingDistanceMeters,
  userId,
}: UpdateEquipmentInput) {
  if (startingDistanceMeters !== undefined) {
    assertValidDistance(startingDistanceMeters, "Equipment Starting Distance");
  }

  if (retirementDistanceMeters !== undefined) {
    assertOptionalDistance(
      retirementDistanceMeters,
      "Equipment Retirement Distance",
    );
  }

  const updated = await updateEquipmentRecord({
    id,
    input: {
      name,
      retirementDistanceMeters,
      startingDistanceMeters,
    },
    userId,
  });

  if (!updated) {
    throw new EquipmentNotFoundError();
  }

  return updated;
}

export async function retireEquipment({
  id,
  now = new Date(),
  userId,
}: RetireEquipmentInput) {
  return transaction(async (database) => {
    const updated = await retireEquipmentRecord({
      database,
      equipmentId: id,
      retiredAt: now,
      userId,
    });

    if (!updated) {
      throw new EquipmentNotFoundError();
    }

    await clearAllDefaultsForEquipment({
      database,
      equipmentId: id,
      userId,
    });

    return getRequiredEquipment({ database, equipmentId: id, userId });
  });
}

export async function restoreEquipment({ id, userId }: RestoreEquipmentInput) {
  const updated = await restoreEquipmentRecord({
    equipmentId: id,
    userId,
  });

  if (!updated) {
    throw new EquipmentNotFoundError();
  }

  return getRequiredEquipment({ equipmentId: id, userId });
}

export async function setDefaultEquipment({
  equipmentId,
  sportType,
  userId,
}: SetDefaultEquipmentInput) {
  return transaction(async (database) => {
    const item = await findEquipmentForAssignment({
      database,
      equipmentId,
      userId,
    });

    if (!item) {
      throw new EquipmentNotFoundError();
    }

    if (item.retiredAt) {
      throw new EquipmentValidationError(
        "Retired Equipment cannot be selected as Default Equipment",
      );
    }

    return setDefaultEquipmentRecord({
      database,
      equipmentId,
      equipmentType: item.equipmentType,
      sportType,
      userId,
    });
  });
}

export async function clearDefaultEquipment({
  equipmentType,
  sportType,
  userId,
}: ClearDefaultEquipmentInput) {
  await clearDefaultEquipmentRecord({
    equipmentType,
    sportType,
    userId,
  });

  return { cleared: true };
}

export async function assignActivityEquipment({
  activityId,
  equipmentId,
  userId,
}: AssignActivityEquipmentInput) {
  return transaction(async (database) => {
    const item = await findEquipmentForAssignment({
      database,
      equipmentId,
      userId,
    });

    if (!item) {
      throw new EquipmentNotFoundError();
    }

    const activity = await findActivityForEquipmentAssignment({
      activityId,
      database,
      userId,
    });

    if (!activity) {
      throw new ActivityEquipmentUseError("Activity was not found");
    }

    return upsertActivityEquipmentUse({
      activityId,
      database,
      equipmentId,
      equipmentType: item.equipmentType,
      userId,
    });
  });
}

export async function removeActivityEquipmentUse({
  activityId,
  equipmentType,
  userId,
}: RemoveActivityEquipmentUseInput) {
  await removeActivityEquipmentUseRecord({
    activityId,
    equipmentType,
    userId,
  });

  return { removed: true };
}

export async function bulkAssignEquipment({
  endAt,
  equipmentId,
  sportType,
  startAt,
  unassignedOnly,
  userId,
}: BulkAssignEquipmentInput) {
  if (endAt <= startAt) {
    throw new ActivityEquipmentUseError("End date must be after start date");
  }

  return transaction(async (database) => {
    const item = await findEquipmentForAssignment({
      database,
      equipmentId,
      userId,
    });

    if (!item) {
      throw new EquipmentNotFoundError();
    }

    const assignment = await bulkAssignEquipmentToActivities({
      database,
      endAt,
      equipmentId,
      equipmentType: item.equipmentType,
      sportType,
      startAt,
      unassignedOnly,
      userId,
    });

    return { assignedCount: assignment.rowCount ?? 0 };
  });
}

export async function assignDefaultEquipmentToImportedActivity({
  activityId,
  sportType,
  userId,
}: {
  activityId: number;
  sportType: SportType;
  userId: string;
}) {
  await assignDefaultEquipmentForActivity({
    activityId,
    sportType,
    userId,
  });
}

async function getRequiredEquipment({
  database,
  equipmentId,
  userId,
}: {
  database?: Parameters<typeof getEquipment>[0]["database"];
  equipmentId: number;
  userId: string;
}) {
  const item = await getEquipment({ database, equipmentId, userId });

  if (!item) {
    throw new EquipmentNotFoundError();
  }

  return item;
}

async function clearAllDefaultsForEquipment({
  database,
  equipmentId,
  userId,
}: {
  database: Parameters<
    typeof clearDefaultEquipmentForEquipmentRecord
  >[0]["database"];
  equipmentId: number;
  userId: string;
}) {
  await clearDefaultEquipmentForEquipmentRecord({
    database,
    equipmentId,
    userId,
  });
}

function assertValidDistance(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new EquipmentValidationError(`${name} must be zero or greater`);
  }
}

function assertOptionalDistance(value: number | null, name: string) {
  if (value === null) {
    return;
  }

  assertValidDistance(value, name);
}
