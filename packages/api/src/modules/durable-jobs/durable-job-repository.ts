import { db } from "@korex/db";
import { and, asc, eq, lt, lte, or, type SQL } from "drizzle-orm";
import type { AnyPgTable, PgColumn } from "drizzle-orm/pg-core";
import {
  durableJobMaxRetryAttempts,
  getDurableJobFailureState,
} from "./durable-job-policy";

type DurableJobTable = AnyPgTable & {
  attemptCount: PgColumn;
  finishedAt: PgColumn;
  id: PgColumn;
  lastError: PgColumn;
  lockedAt: PgColumn;
  lockedBy: PgColumn;
  runAfter: PgColumn;
  status: PgColumn;
  updatedAt: PgColumn;
};

export type DurableJobRepository<TJob> = {
  claim: (input: {
    batchSize: number;
    now?: Date;
    staleLockedBefore: Date;
    workerId: string;
  }) => Promise<TJob[]>;
  markFailed: (input: {
    error: string;
    jobId: number;
    now?: Date;
  }) => Promise<void>;
  markSucceeded: (input: { jobId: number; now?: Date }) => Promise<void>;
};

export type DurableJobRepositoryConfig<TJob> = {
  returning: Record<string, PgColumn>;
  table: DurableJobTable;
  mapClaimedJob: (row: Record<string, unknown>) => TJob;
};

export function createDurableJobRepository<TJob>({
  mapClaimedJob,
  returning,
  table,
}: DurableJobRepositoryConfig<TJob>): DurableJobRepository<TJob> {
  return {
    claim: (input) =>
      claimDurableJobs({
        ...input,
        mapClaimedJob,
        returning,
        table,
      }),
    markFailed: (input) =>
      markDurableJobFailed({
        ...input,
        table,
      }),
    markSucceeded: (input) =>
      markDurableJobSucceeded({
        ...input,
        table,
      }),
  };
}

export function getDurableJobPendingState(now = new Date()) {
  return {
    attemptCount: 0,
    finishedAt: null,
    lastError: null,
    lockedAt: null,
    lockedBy: null,
    runAfter: now,
    status: "pending" as const,
  };
}

async function claimDurableJobs<TJob>({
  batchSize,
  mapClaimedJob,
  now = new Date(),
  returning,
  staleLockedBefore,
  table,
  workerId,
}: DurableJobRepositoryConfig<TJob> & {
  batchSize: number;
  now?: Date;
  staleLockedBefore: Date;
  workerId: string;
}): Promise<TJob[]> {
  return db.transaction(async (tx) => {
    const claimableCondition = getDurableJobClaimableCondition({
      now,
      staleLockedBefore,
      table,
    });

    const claimableJobs = await tx
      .select({ id: table.id })
      .from(table)
      .where(claimableCondition)
      .orderBy(asc(table.runAfter))
      .limit(batchSize);

    if (claimableJobs.length === 0) {
      return [];
    }

    const claimed: TJob[] = [];

    for (const job of claimableJobs) {
      const [updated] = await tx
        .update(table)
        .set(getDurableJobProcessingState({ now, workerId }))
        .where(and(eq(table.id, job.id), claimableCondition))
        .returning(returning);

      if (updated) {
        claimed.push(mapClaimedJob(updated));
      }
    }

    return claimed;
  });
}

async function markDurableJobSucceeded({
  jobId,
  now = new Date(),
  table,
}: {
  jobId: number;
  now?: Date;
  table: DurableJobTable;
}) {
  await db
    .update(table)
    .set(getDurableJobSucceededState(now))
    .where(eq(table.id, jobId));
}

async function markDurableJobFailed({
  error,
  jobId,
  now = new Date(),
  table,
}: {
  error: string;
  jobId: number;
  now?: Date;
  table: DurableJobTable;
}) {
  const [job] = await db
    .select({
      attemptCount: table.attemptCount,
    })
    .from(table)
    .where(eq(table.id, jobId));

  if (!job) {
    return;
  }

  await db
    .update(table)
    .set(
      getDurableJobFailureState({
        attemptCount: Number(job.attemptCount),
        error,
        now,
      }),
    )
    .where(eq(table.id, jobId));
}

function getDurableJobClaimableCondition({
  now,
  staleLockedBefore,
  table,
}: {
  now: Date;
  staleLockedBefore: Date;
  table: DurableJobTable;
}): SQL | undefined {
  return or(
    eq(table.status, "pending"),
    and(
      eq(table.status, "failed"),
      lt(table.attemptCount, durableJobMaxRetryAttempts),
      lte(table.runAfter, now),
    ),
    and(eq(table.status, "processing"), lte(table.lockedAt, staleLockedBefore)),
  );
}

function getDurableJobProcessingState({
  now,
  workerId,
}: {
  now: Date;
  workerId: string;
}) {
  return {
    lockedAt: now,
    lockedBy: workerId,
    status: "processing" as const,
    updatedAt: now,
  };
}

function getDurableJobSucceededState(now: Date) {
  return {
    finishedAt: now,
    lastError: null,
    lockedAt: null,
    lockedBy: null,
    status: "succeeded" as const,
    updatedAt: now,
  };
}
