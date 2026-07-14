import { setTimeout as delay } from "node:timers/promises";
import {
  createJobRuntime,
  enqueueJob,
  enqueueRecurringJob,
  inspectJob,
} from "@korex/api/modules/job-runtime/job-runtime";
import { jobRuntimeJobs } from "@korex/db";
import { count, eq, sql } from "drizzle-orm";
import { createHandlerGate } from "../../setup/operational/handler-gate";
import { createOperationalDatabase } from "../../setup/operational/operational-database";

describe("PostgreSQL Job Runtime contract", () => {
  it("commits or rolls back a domain write and enqueue together", async () => {
    const operationalDatabase = createOperationalDatabase();

    try {
      await operationalDatabase.database.execute(sql`
        create table if not exists job_runtime_contract_writes (
          id integer primary key,
          value text not null
        )
      `);

      let rolledBackJobId = "";

      await expect(
        operationalDatabase.database.transaction(async (transaction) => {
          await transaction.execute(sql`
            insert into job_runtime_contract_writes (id, value)
            values (1, 'rolled back')
          `);
          const job = await enqueueJob({
            database: transaction,
            key: "atomic-write",
            name: "contract.atomic",
            payload: { value: "rolled back" },
          });
          rolledBackJobId = job.id;

          throw new Error("roll back");
        }),
      ).rejects.toThrow("roll back");

      const writes = await operationalDatabase.database.execute(sql`
        select id from job_runtime_contract_writes
      `);

      expect(writes.rows).toEqual([]);
      await expect(
        inspectJob({
          database: operationalDatabase.database,
          id: rolledBackJobId,
        }),
      ).resolves.toBeNull();
    } finally {
      await operationalDatabase.close();
    }
  });

  it("coalesces concurrent keyed enqueues into one pending job", async () => {
    const operationalDatabase = createOperationalDatabase();

    try {
      const jobs = await Promise.all(
        Array.from({ length: 20 }, (_, value) =>
          enqueueJob({
            database: operationalDatabase.database,
            key: "shared-key",
            name: "contract.keyed",
            payload: { value },
          }),
        ),
      );

      expect(new Set(jobs.map((job) => job.id))).toHaveLength(1);

      const [row] = await operationalDatabase.database
        .select({ count: count() })
        .from(jobRuntimeJobs)
        .where(eq(jobRuntimeJobs.name, "contract.keyed"));

      expect(row?.count).toBe(1);
    } finally {
      await operationalDatabase.close();
    }
  });

  it("runs jobs across two runtimes without duplicate successful execution", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    const executions = new Map<string, number>();
    const handler = async (
      _payload: Record<string, unknown>,
      job: { jobId: string },
    ) => {
      executions.set(job.jobId, (executions.get(job.jobId) ?? 0) + 1);
    };
    const firstRuntime = createJobRuntime({
      databaseUrl,
      pollIntervalMs: 10,
      tasks: { "contract.distributed": handler },
      workerId: "contract-runtime-one",
    });
    const secondRuntime = createJobRuntime({
      databaseUrl,
      pollIntervalMs: 10,
      tasks: { "contract.distributed": handler },
      workerId: "contract-runtime-two",
    });

    try {
      const jobs = await Promise.all(
        Array.from({ length: 20 }, (_, value) =>
          enqueueJob({
            database: operationalDatabase.database,
            name: "contract.distributed",
            payload: { value },
          }),
        ),
      );

      await Promise.all([firstRuntime.start(), secondRuntime.start()]);

      await expect
        .poll(async () => {
          const states = await Promise.all(
            jobs.map((job) =>
              inspectJob({
                database: operationalDatabase.database,
                id: job.id,
              }),
            ),
          );

          return states.filter((job) => job?.state === "succeeded").length;
        })
        .toBe(jobs.length);

      expect(executions.size).toBe(jobs.length);
      expect([...executions.values()]).toEqual(
        expect.arrayContaining(Array.from({ length: jobs.length }, () => 1)),
      );
    } finally {
      await Promise.all([firstRuntime.stop(), secondRuntime.stop()]);
      await operationalDatabase.close();
    }
  });

  it("reclaims a crashed attempt and fences its stale owner", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    const staleHandler = createHandlerGate();
    const reclaimed = Promise.withResolvers<void>();
    let executions = 0;
    const firstRuntime = createJobRuntime({
      databaseUrl,
      heartbeatIntervalMs: null,
      leaseMs: 50,
      pollIntervalMs: 10,
      tasks: {
        "contract.reclaim": async () => {
          executions += 1;
          await staleHandler.wait();
          throw new Error("stale owner must not overwrite the result");
        },
      },
      workerId: "contract-stale-owner",
    });
    const secondRuntime = createJobRuntime({
      databaseUrl,
      heartbeatIntervalMs: null,
      leaseMs: 50,
      pollIntervalMs: 10,
      tasks: {
        "contract.reclaim": async () => {
          executions += 1;
          reclaimed.resolve();
        },
      },
      workerId: "contract-reclaimer",
    });

    try {
      const job = await enqueueJob({
        database: operationalDatabase.database,
        name: "contract.reclaim",
        payload: {},
      });

      await firstRuntime.start();
      await staleHandler.waitUntilEntered();
      await operationalDatabase.database.execute(sql`
        update job_runtime_jobs
        set locked_at = now() - interval '1 second'
        where id = ${job.id}
      `);

      await secondRuntime.start();
      await reclaimed.promise;
      await expect
        .poll(
          async () =>
            (
              await inspectJob({
                database: operationalDatabase.database,
                id: job.id,
              })
            )?.state,
        )
        .toBe("succeeded");

      staleHandler.release();
      await expect.poll(() => staleHandler.isWaiting()).toBe(false);

      await expect(
        inspectJob({
          database: operationalDatabase.database,
          id: job.id,
        }),
      ).resolves.toMatchObject({ attemptCount: 2, state: "succeeded" });
      expect(executions).toBe(2);
    } finally {
      staleHandler.release();
      await Promise.all([firstRuntime.stop(), secondRuntime.stop()]);
      await operationalDatabase.close();
    }
  });

  it("keeps one keyed follow-up when enqueue happens during execution", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    const firstExecution = createHandlerGate();
    let executions = 0;
    const runtime = createJobRuntime({
      databaseUrl,
      pollIntervalMs: 10,
      tasks: {
        "contract.follow-up": async () => {
          executions += 1;

          if (executions === 1) {
            await firstExecution.wait();
          }
        },
      },
      workerId: "contract-follow-up",
    });

    try {
      const runningJob = await enqueueJob({
        database: operationalDatabase.database,
        key: "aggregate-1",
        name: "contract.follow-up",
        payload: { version: 1 },
      });

      await runtime.start();
      await firstExecution.waitUntilEntered();

      const followUps = await Promise.all(
        Array.from({ length: 20 }, (_, version) =>
          enqueueJob({
            database: operationalDatabase.database,
            key: "aggregate-1",
            name: "contract.follow-up",
            payload: { version: version + 2 },
          }),
        ),
      );
      const followUpIds = new Set(followUps.map((job) => job.id));

      expect(followUpIds).toHaveLength(1);
      expect(followUpIds.has(runningJob.id)).toBe(false);

      firstExecution.release();
      const followUpId = followUps[0]?.id;
      expect(followUpId).toBeDefined();
      await expect
        .poll(async () =>
          followUpId
            ? (
                await inspectJob({
                  database: operationalDatabase.database,
                  id: followUpId,
                })
              )?.state
            : undefined,
        )
        .toBe("succeeded");

      expect(executions).toBe(2);
    } finally {
      firstExecution.release();
      await runtime.stop();
      await operationalDatabase.close();
    }
  });

  it("preserves a keyed follow-up when the running attempt fails", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    const firstExecution = createHandlerGate();
    let executions = 0;
    const runtime = createJobRuntime({
      databaseUrl,
      pollIntervalMs: 5,
      retryDelayMs: 10,
      tasks: {
        "contract.failed-follow-up": async () => {
          executions += 1;

          if (executions === 1) {
            await firstExecution.wait();
            throw new Error("first attempt failed");
          }
        },
      },
      workerId: "contract-failed-follow-up",
    });

    try {
      const runningJob = await enqueueJob({
        database: operationalDatabase.database,
        key: "aggregate-1",
        name: "contract.failed-follow-up",
        payload: { version: 1 },
      });

      await runtime.start();
      await firstExecution.waitUntilEntered();
      const followUp = await enqueueJob({
        database: operationalDatabase.database,
        key: "aggregate-1",
        name: "contract.failed-follow-up",
        payload: { version: 2 },
      });

      firstExecution.release();
      await expect
        .poll(
          async () =>
            (
              await inspectJob({
                database: operationalDatabase.database,
                id: followUp.id,
              })
            )?.state,
          { timeout: 1_000 },
        )
        .toBe("succeeded");

      await expect(
        inspectJob({
          database: operationalDatabase.database,
          id: runningJob.id,
        }),
      ).resolves.toMatchObject({
        attemptCount: 1,
        lastError: "first attempt failed",
        state: "failed",
      });
      expect(runtime.isReady()).toBe(true);
      expect(executions).toBe(2);
    } finally {
      firstExecution.release();
      await runtime.stop();
      await operationalDatabase.close();
    }
  });

  it("retries failures and exposes terminal inspection without vendor tables", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    let executions = 0;
    const runtime = createJobRuntime({
      databaseUrl,
      pollIntervalMs: 5,
      retryDelayMs: 10,
      tasks: {
        "contract.terminal": async () => {
          executions += 1;
          throw new Error(`failure ${executions}`);
        },
      },
      workerId: "contract-terminal",
    });

    try {
      const job = await enqueueJob({
        database: operationalDatabase.database,
        maxAttempts: 3,
        name: "contract.terminal",
        payload: {},
      });

      await runtime.start();
      await expect
        .poll(
          async () =>
            (
              await inspectJob({
                database: operationalDatabase.database,
                id: job.id,
              })
            )?.state,
          { timeout: 750 },
        )
        .toBe("failed");

      await expect(
        inspectJob({
          database: operationalDatabase.database,
          id: job.id,
        }),
      ).resolves.toMatchObject({
        attemptCount: 3,
        lastError: "failure 3",
        state: "failed",
      });
    } finally {
      await runtime.stop();
      await operationalDatabase.close();
    }
  });

  it("supports idempotent handlers under at-least-once reclaim", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    const staleHandler = createHandlerGate();
    const reclaimed = Promise.withResolvers<void>();
    let executions = 0;
    const writeOnce = async (jobId: string) => {
      executions += 1;
      await operationalDatabase.database.execute(sql`
        insert into job_runtime_contract_writes (id, value)
        values (42, ${jobId})
        on conflict (id) do nothing
      `);
    };
    const firstRuntime = createJobRuntime({
      databaseUrl,
      heartbeatIntervalMs: null,
      leaseMs: 50,
      pollIntervalMs: 10,
      tasks: {
        "contract.idempotent": async (_payload, context) => {
          await writeOnce(context.jobId);
          await staleHandler.wait();
        },
      },
      workerId: "contract-idempotent-stale",
    });
    const secondRuntime = createJobRuntime({
      databaseUrl,
      heartbeatIntervalMs: null,
      leaseMs: 50,
      pollIntervalMs: 10,
      tasks: {
        "contract.idempotent": async (_payload, context) => {
          await writeOnce(context.jobId);
          reclaimed.resolve();
        },
      },
      workerId: "contract-idempotent-reclaimer",
    });

    try {
      await operationalDatabase.database.execute(sql`
        create table if not exists job_runtime_contract_writes (
          id integer primary key,
          value text not null
        )
      `);
      const job = await enqueueJob({
        database: operationalDatabase.database,
        name: "contract.idempotent",
        payload: {},
      });

      await firstRuntime.start();
      await staleHandler.waitUntilEntered();
      await operationalDatabase.database.execute(sql`
        update job_runtime_jobs
        set locked_at = now() - interval '1 second'
        where id = ${job.id}
      `);
      await secondRuntime.start();
      await reclaimed.promise;

      staleHandler.release();
      await expect
        .poll(
          async () =>
            (
              await inspectJob({
                database: operationalDatabase.database,
                id: job.id,
              })
            )?.state,
        )
        .toBe("succeeded");

      const writes = await operationalDatabase.database.execute(sql`
        select id from job_runtime_contract_writes where id = 42
      `);
      expect(executions).toBe(2);
      expect(writes.rows).toHaveLength(1);
    } finally {
      staleHandler.release();
      await Promise.all([firstRuntime.stop(), secondRuntime.stop()]);
      await operationalDatabase.close();
    }
  });

  it("heartbeats a healthy handler beyond the reclaim lease", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    const healthyHandler = createHandlerGate();
    let executions = 0;
    const firstRuntime = createJobRuntime({
      databaseUrl,
      heartbeatIntervalMs: 10,
      leaseMs: 50,
      pollIntervalMs: 5,
      tasks: {
        "contract.healthy-long": async () => {
          executions += 1;
          await healthyHandler.wait();
        },
      },
      workerId: "contract-healthy-owner",
    });
    const secondRuntime = createJobRuntime({
      databaseUrl,
      heartbeatIntervalMs: 10,
      leaseMs: 50,
      pollIntervalMs: 5,
      tasks: {
        "contract.healthy-long": async () => {
          executions += 1;
        },
      },
      workerId: "contract-healthy-contender",
    });

    try {
      const job = await enqueueJob({
        database: operationalDatabase.database,
        name: "contract.healthy-long",
        payload: {},
      });

      await firstRuntime.start();
      await healthyHandler.waitUntilEntered();
      await secondRuntime.start();
      await delay(150);

      expect(executions).toBe(1);
      await expect(
        inspectJob({
          database: operationalDatabase.database,
          id: job.id,
        }),
      ).resolves.toMatchObject({ state: "running" });

      healthyHandler.release();
      await expect
        .poll(
          async () =>
            (
              await inspectJob({
                database: operationalDatabase.database,
                id: job.id,
              })
            )?.state,
        )
        .toBe("succeeded");
    } finally {
      healthyHandler.release();
      await Promise.all([firstRuntime.stop(), secondRuntime.stop()]);
      await operationalDatabase.close();
    }
  });

  it("enqueues one job for each recurring schedule occurrence", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    const runtime = createJobRuntime({
      databaseUrl,
      pollIntervalMs: 5,
      tasks: { "contract.recurring": async () => undefined },
      workerId: "contract-recurring",
    });

    try {
      const occurrences = await Promise.all(
        Array.from({ length: 20 }, () =>
          enqueueRecurringJob({
            database: operationalDatabase.database,
            name: "contract.recurring",
            payload: { week: "2026-07-06" },
            scheduleKey: "completed-week:2026-07-06",
          }),
        ),
      );
      expect(new Set(occurrences.map((job) => job.id))).toHaveLength(1);

      await runtime.start();
      const jobId = occurrences[0]?.id;
      expect(jobId).toBeDefined();
      await expect
        .poll(async () =>
          jobId
            ? (
                await inspectJob({
                  database: operationalDatabase.database,
                  id: jobId,
                })
              )?.state
            : undefined,
        )
        .toBe("succeeded");

      const replay = await enqueueRecurringJob({
        database: operationalDatabase.database,
        name: "contract.recurring",
        payload: { week: "2026-07-06" },
        scheduleKey: "completed-week:2026-07-06",
      });
      expect(replay.id).toBe(jobId);
    } finally {
      await runtime.stop();
      await operationalDatabase.close();
    }
  });

  it("processes a 1,000-job throughput smoke", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    const runtime = createJobRuntime({
      databaseUrl,
      pollIntervalMs: 1,
      tasks: { "contract.throughput": async () => undefined },
      workerId: "contract-throughput",
    });

    try {
      await Promise.all(
        Array.from({ length: 1_000 }, (_, value) =>
          enqueueJob({
            database: operationalDatabase.database,
            name: "contract.throughput",
            payload: { value },
          }),
        ),
      );
      await runtime.start();

      await expect
        .poll(
          async () => {
            const [row] = await operationalDatabase.database
              .select({ count: count() })
              .from(jobRuntimeJobs)
              .where(
                sql`${jobRuntimeJobs.name} = 'contract.throughput' and ${jobRuntimeJobs.state} = 'succeeded'`,
              );

            return row?.count;
          },
          { interval: 100, timeout: 20_000 },
        )
        .toBe(1_000);
    } finally {
      await runtime.stop();
      await operationalDatabase.close();
    }
  });
});

function requiredDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for operational tests");
  }

  return databaseUrl;
}
