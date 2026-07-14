CREATE TYPE "public"."job_runtime_job_state" AS ENUM('queued', 'running', 'retry', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "job_runtime_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"key" text,
	"payload" jsonb NOT NULL,
	"state" "job_runtime_job_state" DEFAULT 'queued' NOT NULL,
	"generation" integer DEFAULT 0 NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 4 NOT NULL,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"last_error" text,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "job_runtime_jobs_pending_key_idx" ON "job_runtime_jobs" USING btree ("name","key") WHERE "job_runtime_jobs"."key" is not null and "job_runtime_jobs"."state" in ('queued', 'retry');--> statement-breakpoint
CREATE INDEX "job_runtime_jobs_claim_idx" ON "job_runtime_jobs" USING btree ("name","state","run_after");--> statement-breakpoint
CREATE INDEX "job_runtime_jobs_locked_at_idx" ON "job_runtime_jobs" USING btree ("locked_at");