import {
  createJobRuntime,
  enqueueJob,
  inspectJob,
} from "@korex/api/modules/job-runtime/job-runtime";
import { createHandlerGate } from "../../setup/operational/handler-gate";
import { createOperationalDatabase } from "../../setup/operational/operational-database";

describe("PostgreSQL Job Runtime lifecycle", () => {
  it("stops claims and lets active work drain before closing", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    const handler = createHandlerGate();
    let handlerSignal: AbortSignal | undefined;
    const runtime = createJobRuntime({
      databaseUrl,
      pollIntervalMs: 5,
      shutdownGraceMs: 500,
      tasks: {
        "lifecycle.drain": async (_payload, context) => {
          handlerSignal = context.signal;
          await handler.wait();
        },
      },
      workerId: "lifecycle-drain",
    });

    try {
      const activeJob = await enqueueJob({
        database: operationalDatabase.database,
        name: "lifecycle.drain",
        payload: { order: 1 },
      });
      const pendingJob = await enqueueJob({
        database: operationalDatabase.database,
        name: "lifecycle.drain",
        payload: { order: 2 },
      });

      expect(runtime.getState()).toBe("new");
      await runtime.start();
      expect(runtime.isReady()).toBe(true);
      await handler.waitUntilEntered();

      const stopping = runtime.stop();
      expect(runtime.getState()).toBe("draining");
      expect(handlerSignal?.aborted).toBe(false);

      handler.release();
      await stopping;
      await runtime.stop();

      expect(runtime.getState()).toBe("stopped");
      await expect(
        inspectJob({
          database: operationalDatabase.database,
          id: activeJob.id,
        }),
      ).resolves.toMatchObject({ state: "succeeded" });
      await expect(
        inspectJob({
          database: operationalDatabase.database,
          id: pendingJob.id,
        }),
      ).resolves.toMatchObject({ state: "queued" });
    } finally {
      handler.release();
      await runtime.stop();
      await operationalDatabase.close();
    }
  });

  it("aborts work after grace expiry and leaves it retryable", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    const entered = Promise.withResolvers<void>();
    const runtime = createJobRuntime({
      databaseUrl,
      pollIntervalMs: 5,
      retryDelayMs: 10,
      shutdownGraceMs: 25,
      tasks: {
        "lifecycle.abort": async (_payload, context) => {
          entered.resolve();
          await new Promise<void>((_resolve, reject) => {
            context.signal.addEventListener(
              "abort",
              () => reject(new Error("shutdown aborted handler")),
              { once: true },
            );
          });
        },
      },
      workerId: "lifecycle-abort",
    });

    try {
      const job = await enqueueJob({
        database: operationalDatabase.database,
        name: "lifecycle.abort",
        payload: {},
      });

      await runtime.start();
      await entered.promise;
      await runtime.stop();

      expect(runtime.getState()).toBe("stopped");
      await expect(
        inspectJob({
          database: operationalDatabase.database,
          id: job.id,
        }),
      ).resolves.toMatchObject({
        attemptCount: 1,
        lastError: "shutdown aborted handler",
        state: "retry",
      });
    } finally {
      await runtime.stop();
      await operationalDatabase.close();
    }
  });

  it("keeps a failing queue from starving a healthy queue", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    const runtime = createJobRuntime({
      databaseUrl,
      pollIntervalMs: 5,
      retryDelayMs: 1_000,
      tasks: {
        "lifecycle.failing": async () => {
          throw new Error("expected queue failure");
        },
        "lifecycle.healthy": async () => undefined,
      },
      workerId: "lifecycle-independent-queues",
    });

    try {
      await enqueueJob({
        database: operationalDatabase.database,
        name: "lifecycle.failing",
        payload: {},
      });
      const healthyJob = await enqueueJob({
        database: operationalDatabase.database,
        name: "lifecycle.healthy",
        payload: {},
      });

      await runtime.start();
      await expect
        .poll(
          async () =>
            (
              await inspectJob({
                database: operationalDatabase.database,
                id: healthyJob.id,
              })
            )?.state,
        )
        .toBe("succeeded");
    } finally {
      await runtime.stop();
      await operationalDatabase.close();
    }
  });

  it("closes its owned Pool after handlers and only once", async () => {
    const databaseUrl = requiredDatabaseUrl();
    const operationalDatabase = createOperationalDatabase(databaseUrl);
    const workerId = "lifecycle-owned-pool";
    const runtime = createJobRuntime({
      databaseUrl,
      tasks: {},
      workerId,
    });

    try {
      await runtime.start();
      await expect.poll(() => runtimeConnectionCount(workerId)).toBe(1);

      await Promise.all([runtime.stop(), runtime.stop()]);
      await runtime.stop();

      await expect.poll(() => runtimeConnectionCount(workerId)).toBe(0);
      expect(runtime.getState()).toBe("stopped");
    } finally {
      await runtime.stop();
      await operationalDatabase.close();
    }

    async function runtimeConnectionCount(id: string) {
      const result = await operationalDatabase.pool.query<{ count: number }>(
        `select count(*)::int as count
         from pg_stat_activity
         where application_name = $1`,
        [`korex-job-runtime:${id}`],
      );

      return result.rows[0]?.count ?? 0;
    }
  });

  it("cleans its Pool when startup fails", async () => {
    const invalidDatabaseUrl = new URL(requiredDatabaseUrl());
    invalidDatabaseUrl.pathname = "/missing_job_runtime_database";
    const runtime = createJobRuntime({
      databaseUrl: invalidDatabaseUrl.toString(),
      tasks: {},
      workerId: "lifecycle-failed-start",
    });

    await expect(runtime.start()).rejects.toThrow();
    expect(runtime.getState()).toBe("stopped");
    await expect(runtime.stop()).resolves.toBeUndefined();
  });

  it("keeps runtimes for two database URLs isolated", async () => {
    const firstDatabaseUrl = requiredDatabaseUrl();
    const adminDatabaseUrl = requiredEnv("KOREX_OPERATIONAL_POSTGRES_URL");
    const adminDatabase = createOperationalDatabase(adminDatabaseUrl);
    const firstDatabaseName = databaseName(firstDatabaseUrl);
    const secondDatabaseName = `korex_op_isolation_${process.pid}_${Date.now()}`;
    const secondDatabaseUrl = new URL(firstDatabaseUrl);
    secondDatabaseUrl.pathname = `/${secondDatabaseName}`;
    const executions: string[] = [];
    let firstRuntime: ReturnType<typeof createJobRuntime> | undefined;
    let secondRuntime: ReturnType<typeof createJobRuntime> | undefined;
    let firstDatabase: ReturnType<typeof createOperationalDatabase> | undefined;
    let secondDatabase:
      | ReturnType<typeof createOperationalDatabase>
      | undefined;

    try {
      await adminDatabase.pool.query(
        `create database ${secondDatabaseName} template ${firstDatabaseName}`,
      );
      firstDatabase = createOperationalDatabase(firstDatabaseUrl);
      secondDatabase = createOperationalDatabase(secondDatabaseUrl.toString());
      firstRuntime = createJobRuntime({
        databaseUrl: firstDatabaseUrl,
        pollIntervalMs: 5,
        tasks: {
          "lifecycle.isolation": async () => {
            executions.push("first");
          },
        },
        workerId: "lifecycle-isolation-first",
      });
      secondRuntime = createJobRuntime({
        databaseUrl: secondDatabaseUrl.toString(),
        pollIntervalMs: 5,
        tasks: {
          "lifecycle.isolation": async () => {
            executions.push("second");
          },
        },
        workerId: "lifecycle-isolation-second",
      });
      const firstJob = await enqueueJob({
        database: firstDatabase.database,
        name: "lifecycle.isolation",
        payload: {},
      });
      const secondJob = await enqueueJob({
        database: secondDatabase.database,
        name: "lifecycle.isolation",
        payload: {},
      });

      await Promise.all([firstRuntime.start(), secondRuntime.start()]);
      await expect
        .poll(async () => {
          const jobs = await Promise.all([
            inspectJob({ database: firstDatabase?.database, id: firstJob.id }),
            inspectJob({
              database: secondDatabase?.database,
              id: secondJob.id,
            }),
          ]);

          return jobs.map((job) => job?.state);
        })
        .toEqual(["succeeded", "succeeded"]);
      expect(executions.sort()).toEqual(["first", "second"]);
    } finally {
      await Promise.all([firstRuntime?.stop(), secondRuntime?.stop()]);
      await Promise.all([firstDatabase?.close(), secondDatabase?.close()]);
      await adminDatabase.pool.query(
        `drop database if exists ${secondDatabaseName} with (force)`,
      );
      await adminDatabase.close();
    }
  });
});

function requiredDatabaseUrl() {
  return requiredEnv("DATABASE_URL");
}

function databaseName(databaseUrl: string) {
  const name = decodeURIComponent(new URL(databaseUrl).pathname.slice(1));

  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe operational database name: ${name}`);
  }

  return name;
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for operational tests`);
  }

  return value;
}
