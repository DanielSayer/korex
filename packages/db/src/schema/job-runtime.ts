import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const jobRuntimeJobState = pgEnum("job_runtime_job_state", [
  "queued",
  "running",
  "retry",
  "succeeded",
  "failed",
]);

export const jobRuntimeJobs = pgTable(
  "job_runtime_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    key: text("key"),
    scheduleKey: text("schedule_key"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    state: jobRuntimeJobState("state").default("queued").notNull(),
    generation: integer("generation").default(0).notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(4).notNull(),
    runAfter: timestamp("run_after", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    lastError: text("last_error"),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("job_runtime_jobs_pending_key_idx")
      .on(table.name, table.key)
      .where(
        sql`${table.key} is not null and ${table.state} in ('queued', 'retry')`,
      ),
    uniqueIndex("job_runtime_jobs_schedule_key_idx").on(
      table.name,
      table.scheduleKey,
    ),
    index("job_runtime_jobs_claim_idx").on(
      table.name,
      table.state,
      table.runAfter,
    ),
    index("job_runtime_jobs_locked_at_idx").on(table.lockedAt),
  ],
);
