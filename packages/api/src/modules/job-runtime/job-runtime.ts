import { db, jobRuntimeJobs } from "@korex/db";
import { eq, sql } from "drizzle-orm";

export type {
  JobHandler,
  JobHandlerContext,
  JobRuntime,
  JobRuntimeState,
} from "./postgres-job-runtime";
export { createJobRuntime } from "./postgres-job-runtime";

type JobDatabase = Pick<typeof db, "insert" | "select">;

export type JobState = "queued" | "running" | "retry" | "succeeded" | "failed";

export type JobInspection = {
  attemptCount: number;
  finishedAt: Date | null;
  id: string;
  key: string | null;
  lastError: string | null;
  maxAttempts: number;
  name: string;
  payload: Record<string, unknown>;
  state: JobState;
};

export async function enqueueJob({
  database = db,
  key,
  maxAttempts = 4,
  name,
  payload,
  runAfter = new Date(),
}: {
  database?: JobDatabase;
  key?: string;
  maxAttempts?: number;
  name: string;
  payload: Record<string, unknown>;
  runAfter?: Date;
}) {
  const values = {
    key: key ?? null,
    maxAttempts,
    name,
    payload,
    runAfter,
  };

  if (!key) {
    const [job] = await database
      .insert(jobRuntimeJobs)
      .values(values)
      .returning({ id: jobRuntimeJobs.id });

    return requiredJob(job);
  }

  const [job] = await database
    .insert(jobRuntimeJobs)
    .values(values)
    .onConflictDoUpdate({
      set: {
        attemptCount: 0,
        finishedAt: null,
        lastError: null,
        maxAttempts,
        payload,
        runAfter,
        state: "queued",
        updatedAt: new Date(),
      },
      target: [jobRuntimeJobs.name, jobRuntimeJobs.key],
      targetWhere: sql`${jobRuntimeJobs.key} is not null and ${jobRuntimeJobs.state} in ('queued', 'retry')`,
    })
    .returning({ id: jobRuntimeJobs.id });

  return requiredJob(job);
}

export async function enqueueRecurringJob({
  database = db,
  maxAttempts = 4,
  name,
  payload,
  runAfter = new Date(),
  scheduleKey,
}: {
  database?: JobDatabase;
  maxAttempts?: number;
  name: string;
  payload: Record<string, unknown>;
  runAfter?: Date;
  scheduleKey: string;
}) {
  const [inserted] = await database
    .insert(jobRuntimeJobs)
    .values({ maxAttempts, name, payload, runAfter, scheduleKey })
    .onConflictDoNothing({
      target: [jobRuntimeJobs.name, jobRuntimeJobs.scheduleKey],
    })
    .returning({ id: jobRuntimeJobs.id });

  if (inserted) {
    return inserted;
  }

  const [existing] = await database
    .select({ id: jobRuntimeJobs.id })
    .from(jobRuntimeJobs)
    .where(
      sql`${jobRuntimeJobs.name} = ${name} and ${jobRuntimeJobs.scheduleKey} = ${scheduleKey}`,
    );

  return requiredJob(existing);
}

export async function inspectJob({
  database = db,
  id,
}: {
  database?: JobDatabase;
  id: string;
}): Promise<JobInspection | null> {
  const [job] = await database
    .select({
      attemptCount: jobRuntimeJobs.attemptCount,
      finishedAt: jobRuntimeJobs.finishedAt,
      id: jobRuntimeJobs.id,
      key: jobRuntimeJobs.key,
      lastError: jobRuntimeJobs.lastError,
      maxAttempts: jobRuntimeJobs.maxAttempts,
      name: jobRuntimeJobs.name,
      payload: jobRuntimeJobs.payload,
      state: jobRuntimeJobs.state,
    })
    .from(jobRuntimeJobs)
    .where(eq(jobRuntimeJobs.id, id));

  return job ?? null;
}

function requiredJob(job: { id: string } | undefined) {
  if (!job) {
    throw new Error("Job enqueue did not return a job");
  }

  return job;
}
