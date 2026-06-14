import {
  activities,
  activityEquipmentUses,
  db,
  defaultEquipment,
  equipment,
} from "@korex/db";
import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";
import type { SportType } from "../activities/activities.types";
import type {
  ActivityEquipmentUse,
  DefaultEquipment,
  Equipment,
  EquipmentType,
} from "./equipment.types";

export type EquipmentDatabase = Pick<
  typeof db,
  "delete" | "insert" | "select" | "transaction" | "update"
>;

export async function transaction<T>(
  callback: (database: EquipmentDatabase) => Promise<T>,
) {
  return db.transaction(callback);
}

export async function createEquipmentRecord({
  database = db,
  equipmentType,
  name,
  retirementDistanceMeters,
  startingDistanceMeters,
  userId,
}: {
  database?: EquipmentDatabase;
  equipmentType: EquipmentType;
  name: string;
  retirementDistanceMeters: number | null;
  startingDistanceMeters: number;
  userId: string;
}): Promise<Equipment> {
  const [created] = await database
    .insert(equipment)
    .values({
      equipmentType,
      name,
      retirementDistanceMeters,
      startingDistanceMeters,
      userId,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create Equipment");
  }

  return {
    ...created,
    activityCount: 0,
    usageDistanceMeters: created.startingDistanceMeters,
  };
}

export async function updateEquipmentRecord({
  database = db,
  id,
  input,
  userId,
}: {
  database?: EquipmentDatabase;
  id: number;
  input: {
    name?: string;
    retirementDistanceMeters?: number | null;
    startingDistanceMeters?: number;
  };
  userId: string;
}): Promise<Equipment | null> {
  const [updated] = await database
    .update(equipment)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(equipment.id, id), eq(equipment.userId, userId)))
    .returning();

  if (!updated) {
    return null;
  }

  return getEquipment({ database, equipmentId: updated.id, userId });
}

export async function retireEquipmentRecord({
  database = db,
  equipmentId,
  retiredAt,
  userId,
}: {
  database?: EquipmentDatabase;
  equipmentId: number;
  retiredAt: Date;
  userId: string;
}) {
  const [updated] = await database
    .update(equipment)
    .set({
      retiredAt,
      updatedAt: new Date(),
    })
    .where(and(eq(equipment.id, equipmentId), eq(equipment.userId, userId)))
    .returning({ id: equipment.id });

  return updated ?? null;
}

export async function restoreEquipmentRecord({
  database = db,
  equipmentId,
  userId,
}: {
  database?: EquipmentDatabase;
  equipmentId: number;
  userId: string;
}) {
  const [updated] = await database
    .update(equipment)
    .set({
      retiredAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(equipment.id, equipmentId), eq(equipment.userId, userId)))
    .returning({ id: equipment.id });

  return updated ?? null;
}

export async function getEquipment({
  database = db,
  equipmentId,
  userId,
}: {
  database?: EquipmentDatabase;
  equipmentId: number;
  userId: string;
}): Promise<Equipment | null> {
  const [row] = await equipmentUsageQuery(database)
    .where(and(eq(equipment.id, equipmentId), eq(equipment.userId, userId)))
    .groupBy(equipment.id)
    .limit(1);

  return row ?? null;
}

export async function listEquipment({
  userId,
}: {
  userId: string;
}): Promise<Equipment[]> {
  return equipmentUsageQuery(db)
    .where(eq(equipment.userId, userId))
    .groupBy(equipment.id)
    .orderBy(equipment.retiredAt, equipment.name);
}

export async function findEquipmentForAssignment({
  database = db,
  equipmentId,
  userId,
}: {
  database?: EquipmentDatabase;
  equipmentId: number;
  userId: string;
}) {
  const [row] = await database
    .select({
      equipmentType: equipment.equipmentType,
      id: equipment.id,
      retiredAt: equipment.retiredAt,
      userId: equipment.userId,
    })
    .from(equipment)
    .where(and(eq(equipment.id, equipmentId), eq(equipment.userId, userId)))
    .limit(1);

  return row ?? null;
}

export async function findActivityForEquipmentAssignment({
  activityId,
  database = db,
  userId,
}: {
  activityId: number;
  database?: EquipmentDatabase;
  userId: string;
}) {
  const [row] = await database
    .select({
      id: activities.id,
      sportType: activities.sportType,
      userId: activities.userId,
    })
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.userId, userId)))
    .limit(1);

  return row ?? null;
}

export async function upsertActivityEquipmentUse({
  activityId,
  database = db,
  equipmentId,
  equipmentType,
  userId,
}: {
  activityId: number;
  database?: EquipmentDatabase;
  equipmentId: number;
  equipmentType: EquipmentType;
  userId: string;
}): Promise<ActivityEquipmentUse> {
  const [use] = await database
    .insert(activityEquipmentUses)
    .values({
      activityId,
      equipmentId,
      equipmentType,
      userId,
    })
    .onConflictDoUpdate({
      set: {
        equipmentId,
        updatedAt: new Date(),
      },
      target: [
        activityEquipmentUses.activityId,
        activityEquipmentUses.equipmentType,
      ],
    })
    .returning();

  if (!use) {
    throw new Error("Failed to assign Equipment to Activity");
  }

  return use;
}

export async function removeActivityEquipmentUseRecord({
  activityId,
  database = db,
  equipmentType,
  userId,
}: {
  activityId: number;
  database?: EquipmentDatabase;
  equipmentType: EquipmentType;
  userId: string;
}) {
  await database
    .delete(activityEquipmentUses)
    .where(
      and(
        eq(activityEquipmentUses.activityId, activityId),
        eq(activityEquipmentUses.equipmentType, equipmentType),
        eq(activityEquipmentUses.userId, userId),
      ),
    );
}

export async function setDefaultEquipmentRecord({
  database = db,
  equipmentId,
  equipmentType,
  sportType,
  userId,
}: {
  database?: EquipmentDatabase;
  equipmentId: number;
  equipmentType: EquipmentType;
  sportType: SportType;
  userId: string;
}): Promise<DefaultEquipment> {
  await clearDefaultEquipmentRecord({
    database,
    equipmentType,
    sportType,
    userId,
  });

  const [created] = await database
    .insert(defaultEquipment)
    .values({
      equipmentId,
      equipmentType,
      sportType,
      userId,
    })
    .returning({
      createdAt: defaultEquipment.createdAt,
      equipmentId: defaultEquipment.equipmentId,
      equipmentType: defaultEquipment.equipmentType,
      id: defaultEquipment.id,
      sportType: defaultEquipment.sportType,
      updatedAt: defaultEquipment.updatedAt,
      userId: defaultEquipment.userId,
    });

  if (!created) {
    throw new Error("Failed to set Default Equipment");
  }

  return created;
}

export async function clearDefaultEquipmentRecord({
  database = db,
  equipmentType,
  sportType,
  userId,
}: {
  database?: EquipmentDatabase;
  equipmentType: EquipmentType;
  sportType: SportType;
  userId: string;
}) {
  await database
    .update(defaultEquipment)
    .set({
      clearedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(defaultEquipment.userId, userId),
        eq(defaultEquipment.equipmentType, equipmentType),
        eq(defaultEquipment.sportType, sportType),
        isNull(defaultEquipment.clearedAt),
      ),
    );
}

export async function clearDefaultEquipmentForEquipmentRecord({
  database = db,
  equipmentId,
  userId,
}: {
  database?: EquipmentDatabase;
  equipmentId: number;
  userId: string;
}) {
  await database
    .update(defaultEquipment)
    .set({
      clearedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(defaultEquipment.userId, userId),
        eq(defaultEquipment.equipmentId, equipmentId),
        isNull(defaultEquipment.clearedAt),
      ),
    );
}

export async function listDefaultEquipment({
  userId,
}: {
  userId: string;
}): Promise<DefaultEquipment[]> {
  return db
    .select({
      createdAt: defaultEquipment.createdAt,
      equipmentId: defaultEquipment.equipmentId,
      equipmentType: defaultEquipment.equipmentType,
      id: defaultEquipment.id,
      sportType: defaultEquipment.sportType,
      updatedAt: defaultEquipment.updatedAt,
      userId: defaultEquipment.userId,
    })
    .from(defaultEquipment)
    .where(
      and(
        eq(defaultEquipment.userId, userId),
        isNull(defaultEquipment.clearedAt),
      ),
    );
}

export async function assignDefaultEquipmentForActivity({
  activityId,
  database = db,
  sportType,
  userId,
}: {
  activityId: number;
  database?: EquipmentDatabase;
  sportType: SportType;
  userId: string;
}) {
  const defaults = await database
    .select({
      equipmentId: defaultEquipment.equipmentId,
      equipmentType: defaultEquipment.equipmentType,
    })
    .from(defaultEquipment)
    .innerJoin(equipment, eq(equipment.id, defaultEquipment.equipmentId))
    .where(
      and(
        eq(defaultEquipment.userId, userId),
        eq(defaultEquipment.sportType, sportType),
        isNull(defaultEquipment.clearedAt),
        isNull(equipment.retiredAt),
      ),
    );

  for (const defaultItem of defaults) {
    const [existingUse] = await database
      .select({ id: activityEquipmentUses.id })
      .from(activityEquipmentUses)
      .where(
        and(
          eq(activityEquipmentUses.activityId, activityId),
          eq(activityEquipmentUses.equipmentType, defaultItem.equipmentType),
          eq(activityEquipmentUses.userId, userId),
        ),
      )
      .limit(1);

    if (existingUse) {
      continue;
    }

    await database.insert(activityEquipmentUses).values({
      activityId,
      equipmentId: defaultItem.equipmentId,
      equipmentType: defaultItem.equipmentType,
      userId,
    });
  }
}

export async function bulkAssignEquipmentToActivities({
  database = db,
  endAt,
  equipmentId,
  equipmentType,
  sportType,
  startAt,
  unassignedOnly,
  userId,
}: {
  database?: EquipmentDatabase;
  endAt: Date;
  equipmentId: number;
  equipmentType: EquipmentType;
  sportType: SportType;
  startAt: Date;
  unassignedOnly: boolean;
  userId: string;
}) {
  const candidateActivities = await database
    .select({
      activityId: activities.id,
      existingUseId: activityEquipmentUses.id,
    })
    .from(activities)
    .leftJoin(
      activityEquipmentUses,
      and(
        eq(activityEquipmentUses.activityId, activities.id),
        eq(activityEquipmentUses.equipmentType, equipmentType),
      ),
    )
    .where(
      and(
        eq(activities.userId, userId),
        eq(activities.sportType, sportType),
        gte(activities.startAt, startAt),
        lt(activities.startAt, endAt),
      ),
    );

  let assignedCount = 0;

  for (const candidate of candidateActivities) {
    if (unassignedOnly && candidate.existingUseId) {
      continue;
    }

    await upsertActivityEquipmentUse({
      activityId: candidate.activityId,
      database,
      equipmentId,
      equipmentType,
      userId,
    });
    assignedCount += 1;
  }

  return { assignedCount };
}

function equipmentUsageQuery(database: EquipmentDatabase) {
  return database
    .select({
      activityCount: sql<number>`count(${activityEquipmentUses.id})::int`,
      createdAt: equipment.createdAt,
      equipmentType: equipment.equipmentType,
      id: equipment.id,
      name: equipment.name,
      retiredAt: equipment.retiredAt,
      retirementDistanceMeters: equipment.retirementDistanceMeters,
      startingDistanceMeters: equipment.startingDistanceMeters,
      updatedAt: equipment.updatedAt,
      usageDistanceMeters: sql<number>`(${equipment.startingDistanceMeters} + coalesce(sum(${activities.distanceMeters}), 0))`,
      userId: equipment.userId,
    })
    .from(equipment)
    .leftJoin(
      activityEquipmentUses,
      eq(activityEquipmentUses.equipmentId, equipment.id),
    )
    .leftJoin(activities, eq(activities.id, activityEquipmentUses.activityId));
}
