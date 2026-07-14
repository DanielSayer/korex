import * as schema from "@korex/db/schema/index";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export type JobHandlerContext = {
  database: NodePgDatabase<typeof schema>;
  jobId: string;
  signal: AbortSignal;
};

export type JobHandler = (
  payload: Record<string, unknown>,
  context: JobHandlerContext,
) => Promise<void>;

export type JobRuntimeState =
  | "new"
  | "starting"
  | "ready"
  | "draining"
  | "stopped";

export type JobRuntime = {
  getState: () => JobRuntimeState;
  isReady: () => boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
};

type ClaimedJob = {
  attemptCount: number;
  generation: number;
  id: string;
  lockedBy: string;
  maxAttempts: number;
  payload: Record<string, unknown>;
};

export function createJobRuntime({
  databaseUrl,
  leaseMs = 60_000,
  heartbeatIntervalMs = Math.max(10, Math.floor(leaseMs / 3)),
  pollIntervalMs = 1_000,
  retryDelayMs = 1_000,
  shutdownGraceMs = 30_000,
  tasks,
  workerId = createWorkerId(),
}: {
  databaseUrl: string;
  heartbeatIntervalMs?: number | null;
  leaseMs?: number;
  pollIntervalMs?: number;
  retryDelayMs?: number;
  shutdownGraceMs?: number;
  tasks: Record<string, JobHandler>;
  workerId?: string;
}): JobRuntime {
  const pool = new Pool({
    application_name: `korex-job-runtime:${workerId}`,
    connectionString: databaseUrl,
  });
  const database = drizzle(pool, { schema });
  const claimController = new AbortController();
  const handlerControllers = new Set<AbortController>();
  let closePromise: Promise<void> | undefined;
  let loopPromises: Promise<void>[] = [];
  let state: JobRuntimeState = "new";

  return {
    getState: () => state,
    isReady: () => state === "ready",
    start: async () => {
      if (state !== "new") {
        throw new Error(`Cannot start job runtime from ${state}`);
      }

      state = "starting";
      try {
        await database.execute(sql`select 1`);
        loopPromises = Object.entries(tasks).map(([name, handler]) =>
          runTaskLoop({
            claim: () => claimNextJob(name),
            claimController,
            database,
            handler,
            handlerControllers,
            heartbeat:
              heartbeatIntervalMs === null
                ? undefined
                : (job, signal) => heartbeatJob(job, signal),
            pollIntervalMs,
            settleFailure,
            settleSuccess,
          }),
        );
        state = "ready";
      } catch (error) {
        claimController.abort();
        await pool.end();
        state = "stopped";
        closePromise = Promise.resolve();
        throw error;
      }
    },
    stop: async () => {
      if (closePromise) {
        return closePromise;
      }

      closePromise = (async () => {
        if (state === "new") {
          state = "stopped";
          await pool.end();
          return;
        }

        state = "draining";
        claimController.abort();
        const drained = Promise.all(loopPromises);

        if (await graceExpired(drained, shutdownGraceMs)) {
          for (const handlerController of handlerControllers) {
            handlerController.abort();
          }

          await drained;
        }

        await pool.end();
        state = "stopped";
      })();

      return closePromise;
    },
  };

  async function claimNextJob(name: string) {
    return database.transaction(async (transaction) => {
      const result = await transaction.execute(sql`
        with candidate as (
          select id
          from job_runtime_jobs
          where name = ${name}
            and (
              (state in ('queued', 'retry') and run_after <= now())
              or (
                state = 'running'
                and locked_at <= now() - (${leaseMs} * interval '1 millisecond')
              )
            )
          order by run_after, created_at
          for update skip locked
          limit 1
        )
        update job_runtime_jobs as job
        set state = 'running',
            generation = job.generation + 1,
            attempt_count = job.attempt_count + 1,
            locked_at = now(),
            locked_by = ${workerId},
            updated_at = now()
        from candidate
        where job.id = candidate.id
        returning job.id,
                  job.payload,
                  job.generation,
                  job.attempt_count as "attemptCount",
                  job.max_attempts as "maxAttempts",
                  job.locked_by as "lockedBy"
      `);

      return result.rows[0] as ClaimedJob | undefined;
    });
  }

  async function settleSuccess(job: ClaimedJob) {
    await database.execute(sql`
      update job_runtime_jobs
      set state = 'succeeded',
          finished_at = now(),
          locked_at = null,
          locked_by = null,
          updated_at = now()
      where id = ${job.id}
        and state = 'running'
        and generation = ${job.generation}
        and locked_by = ${job.lockedBy}
    `);
  }

  async function heartbeatJob(job: ClaimedJob, signal: AbortSignal) {
    while (!signal.aborted) {
      await abortableDelay(heartbeatIntervalMs ?? leaseMs, signal);

      if (signal.aborted) {
        return;
      }

      await database.execute(sql`
        update job_runtime_jobs
        set locked_at = now(),
            updated_at = now()
        where id = ${job.id}
          and state = 'running'
          and generation = ${job.generation}
          and locked_by = ${job.lockedBy}
      `);
    }
  }

  async function settleFailure(job: ClaimedJob, error: unknown) {
    const lastError = error instanceof Error ? error.message : String(error);
    const nextState = job.attemptCount >= job.maxAttempts ? "failed" : "retry";
    const hasPendingFollowUp = sql`
      ${nextState} = 'retry'
      and job.key is not null
      and exists (
        select 1
        from job_runtime_jobs as pending
        where pending.id <> job.id
          and pending.name = job.name
          and pending.key = job.key
          and pending.state in ('queued', 'retry')
      )
    `;

    await database.execute(sql`
      update job_runtime_jobs as job
      set state = case
            when ${hasPendingFollowUp}
              then 'failed'::job_runtime_job_state
            else ${nextState}::job_runtime_job_state
          end,
          last_error = ${lastError},
          finished_at = case
            when ${nextState} = 'failed' or ${hasPendingFollowUp}
              then now()
            else null
          end,
          run_after = case
            when ${nextState} = 'retry'
              then now() + (${retryDelayMs} * interval '1 millisecond')
            else run_after
          end,
          locked_at = null,
          locked_by = null,
          updated_at = now()
      where id = ${job.id}
        and state = 'running'
        and generation = ${job.generation}
        and locked_by = ${job.lockedBy}
    `);
  }
}

async function runTaskLoop({
  claim,
  claimController,
  database,
  handler,
  handlerControllers,
  heartbeat,
  pollIntervalMs,
  settleFailure,
  settleSuccess,
}: {
  claim: () => Promise<ClaimedJob | undefined>;
  claimController: AbortController;
  database: NodePgDatabase<typeof schema>;
  handler: JobHandler;
  handlerControllers: Set<AbortController>;
  heartbeat?: (job: ClaimedJob, signal: AbortSignal) => Promise<void>;
  pollIntervalMs: number;
  settleFailure: (job: ClaimedJob, error: unknown) => Promise<void>;
  settleSuccess: (job: ClaimedJob) => Promise<void>;
}) {
  while (!claimController.signal.aborted) {
    const job = await claim();

    if (!job) {
      await abortableDelay(pollIntervalMs, claimController.signal);
      continue;
    }

    const handlerController = new AbortController();
    handlerControllers.add(handlerController);
    const heartbeatController = new AbortController();
    const heartbeatPromise = heartbeat
      ? heartbeat(job, heartbeatController.signal).catch(() => undefined)
      : undefined;

    try {
      await handler(job.payload, {
        database,
        jobId: job.id,
        signal: handlerController.signal,
      });
      await settleSuccess(job);
    } catch (error) {
      await settleFailure(job, error);
    } finally {
      handlerControllers.delete(handlerController);
      heartbeatController.abort();
      await heartbeatPromise;
    }
  }
}

async function graceExpired(drained: Promise<unknown>, graceMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const expired = await Promise.race([
    drained.then(() => false),
    new Promise<true>((resolve) => {
      timeout = setTimeout(() => resolve(true), graceMs);
    }),
  ]);

  clearTimeout(timeout);
  return expired;
}

function abortableDelay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    const timeout = setTimeout(done, ms);
    signal.addEventListener("abort", done, { once: true });

    function done() {
      clearTimeout(timeout);
      signal.removeEventListener("abort", done);
      resolve();
    }
  });
}

function createWorkerId() {
  return `job-runtime-${crypto.randomUUID()}`;
}
