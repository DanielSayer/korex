CREATE TYPE "public"."activity_sport_type" AS ENUM('run', 'treadmill', 'hike');--> statement-breakpoint
CREATE TYPE "public"."activity_stream_type" AS ENUM('cadence', 'distance', 'altitude', 'heartRate', 'elapsedTime', 'velocity');--> statement-breakpoint
CREATE TYPE "public"."best_effort_standard_distance_code" AS ENUM('400m', '800m', '1000m', '1mi', '3000m', '5k', '10k', 'half_marathon', 'marathon');--> statement-breakpoint
CREATE TYPE "public"."activity_best_effort_calculation_job_status" AS ENUM('pending', 'processing', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."activity_heart_rate_zone_time_calculation_job_status" AS ENUM('pending', 'processing', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."activity_route_heatmap_calculation_job_status" AS ENUM('pending', 'processing', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."training_streak_update_job_status" AS ENUM('pending', 'processing', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."equipment_type" AS ENUM('shoes');--> statement-breakpoint
CREATE TYPE "public"."external_provider" AS ENUM('intervals_icu');--> statement-breakpoint
CREATE TYPE "public"."provider_auth_type" AS ENUM('basic', 'oauth');--> statement-breakpoint
CREATE TYPE "public"."provider_connection_status" AS ENUM('active', 'disconnected', 'expired', 'error');--> statement-breakpoint
CREATE TYPE "public"."sync_run_status" AS ENUM('pending', 'running', 'success', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."sync_type" AS ENUM('initial', 'incremental', 'manual', 'backfill');--> statement-breakpoint
CREATE TYPE "public"."training_goal_metric" AS ENUM('distance', 'activityCount');--> statement-breakpoint
CREATE TYPE "public"."training_goal_period" AS ENUM('trainingWeek', 'calendarMonth');--> statement-breakpoint
CREATE TYPE "public"."training_goal_sport_scope" AS ENUM('running');--> statement-breakpoint
CREATE TYPE "public"."weekly_training_summary_generation_job_status" AS ENUM('pending', 'processing', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"sport_type" "activity_sport_type" NOT NULL,
	"start_at" timestamp NOT NULL,
	"device_name" text,
	"moving_time_seconds" integer,
	"elapsed_time_seconds" integer,
	"distance_meters" double precision,
	"total_elevation_gain_meters" double precision,
	"total_elevation_loss_meters" double precision,
	"average_speed_meters_per_second" double precision,
	"max_speed_meters_per_second" double precision,
	"average_heart_rate_beats_per_minute" integer,
	"max_heart_rate_beats_per_minute" integer,
	"average_cadence_steps_per_minute" integer,
	"energy_kilocalories" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_best_efforts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_id" integer NOT NULL,
	"standard_distance_code" "best_effort_standard_distance_code" NOT NULL,
	"distance_meters" double precision NOT NULL,
	"duration_seconds" double precision NOT NULL,
	"start_elapsed_time_seconds" double precision NOT NULL,
	"end_elapsed_time_seconds" double precision NOT NULL,
	"start_distance_meters" double precision NOT NULL,
	"end_distance_meters" double precision NOT NULL,
	"activity_start_at" timestamp NOT NULL,
	"sport_type" "activity_sport_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_heart_rate_zone_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"min_bpm" integer NOT NULL,
	"max_bpm" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_heart_rate_zone_times" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"position" integer NOT NULL,
	"time_seconds" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_laps" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"index" integer NOT NULL,
	"distance_meters" double precision NOT NULL,
	"moving_time_seconds" integer,
	"elapsed_time_seconds" integer,
	"start_time_seconds" integer NOT NULL,
	"end_time_seconds" integer NOT NULL,
	"average_speed_meters_per_second" double precision,
	"max_speed_meters_per_second" double precision,
	"average_heart_rate_beats_per_minute" integer,
	"max_heart_rate_beats_per_minute" integer,
	"average_cadence_steps_per_minute" integer,
	"average_stride_length_meters" double precision,
	"total_elevation_gain_meters" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_maps" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"bounds" jsonb,
	"coordinates" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_route_heatmap_cells" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"zoom" integer NOT NULL,
	"tile_x" integer NOT NULL,
	"tile_y" integer NOT NULL,
	"cell_x" integer NOT NULL,
	"cell_y" integer NOT NULL,
	"activity_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_route_heatmap_contributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_id" integer NOT NULL,
	"activity_start_at" timestamp NOT NULL,
	"zoom" integer NOT NULL,
	"tile_x" integer NOT NULL,
	"tile_y" integer NOT NULL,
	"cell_x" integer NOT NULL,
	"cell_y" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"stream_type" "activity_stream_type" NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_best_efforts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_best_effort_id" integer NOT NULL,
	"activity_id" integer NOT NULL,
	"standard_distance_code" "best_effort_standard_distance_code" NOT NULL,
	"distance_meters" double precision NOT NULL,
	"duration_seconds" double precision NOT NULL,
	"start_elapsed_time_seconds" double precision NOT NULL,
	"end_elapsed_time_seconds" double precision NOT NULL,
	"activity_start_at" timestamp NOT NULL,
	"sport_type" "activity_sport_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"max_streak" integer DEFAULT 0 NOT NULL,
	"last_qualified_week_start_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_best_effort_calculation_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"status" "activity_best_effort_calculation_job_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"run_after" timestamp DEFAULT now() NOT NULL,
	"locked_at" timestamp,
	"locked_by" text,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_heart_rate_zone_time_calculation_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"status" "activity_heart_rate_zone_time_calculation_job_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"run_after" timestamp DEFAULT now() NOT NULL,
	"locked_at" timestamp,
	"locked_by" text,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_route_heatmap_calculation_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"status" "activity_route_heatmap_calculation_job_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"run_after" timestamp DEFAULT now() NOT NULL,
	"locked_at" timestamp,
	"locked_by" text,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_streak_update_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"week_start_at" timestamp NOT NULL,
	"status" "training_streak_update_job_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"run_after" timestamp DEFAULT now() NOT NULL,
	"locked_at" timestamp,
	"locked_by" text,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_equipment_uses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_id" integer NOT NULL,
	"equipment_id" integer NOT NULL,
	"equipment_type" "equipment_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "default_equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"equipment_id" integer NOT NULL,
	"equipment_type" "equipment_type" NOT NULL,
	"sport_type" "activity_sport_type" NOT NULL,
	"cleared_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"equipment_type" "equipment_type" NOT NULL,
	"starting_distance_meters" double precision DEFAULT 0 NOT NULL,
	"retirement_distance_meters" double precision,
	"retired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heart_rate_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"min_bpm" integer NOT NULL,
	"max_bpm" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "heart_rate_zones_position_positive" CHECK ("heart_rate_zones"."position" > 0),
	CONSTRAINT "heart_rate_zones_min_bpm_non_negative" CHECK ("heart_rate_zones"."min_bpm" >= 0),
	CONSTRAINT "heart_rate_zones_max_bpm_greater_than_min" CHECK ("heart_rate_zones"."max_bpm" is null or "heart_rate_zones"."max_bpm" > "heart_rate_zones"."min_bpm")
);
--> statement-breakpoint
CREATE TABLE "external_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" "external_provider" NOT NULL,
	"provider_activity_id" text NOT NULL,
	"provider_athlete_id" text,
	"activity_id" integer,
	"activity_start_at" timestamp NOT NULL,
	"activity_end_at" timestamp,
	"provider_updated_at" timestamp,
	"sport_type" text,
	"source_type" text,
	"raw_data" jsonb NOT NULL,
	"payload_hash" text,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"last_sync_run_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_activity_maps" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_activity_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"provider" "external_provider" NOT NULL,
	"provider_activity_id" text NOT NULL,
	"raw_data" jsonb NOT NULL,
	"payload_hash" text,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_sync_run_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_activity_streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_activity_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"provider" "external_provider" NOT NULL,
	"provider_activity_id" text NOT NULL,
	"stream_type" text NOT NULL,
	"raw_data" jsonb NOT NULL,
	"payload_hash" text,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_sync_run_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" "external_provider" NOT NULL,
	"provider_user_id" text NOT NULL,
	"provider_user_name" text,
	"status" "provider_connection_status" NOT NULL,
	"auth_type" "provider_auth_type" NOT NULL,
	"auth_username" text NOT NULL,
	"auth_secret_encrypted" text NOT NULL,
	"auth_expires_at" timestamp,
	"scopes" jsonb,
	"metadata" jsonb,
	"last_sync_cursor" jsonb,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"disconnected_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" "external_provider" NOT NULL,
	"status" "sync_run_status" NOT NULL,
	"sync_type" "sync_type" NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"cursor_before" jsonb,
	"cursor_after" jsonb,
	"activities_seen" integer DEFAULT 0 NOT NULL,
	"activities_created" integer DEFAULT 0 NOT NULL,
	"activities_updated" integer DEFAULT 0 NOT NULL,
	"activities_deleted" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_goal_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"training_goal_id" integer NOT NULL,
	"target_value" integer NOT NULL,
	"effective_from_period_start_at" timestamp NOT NULL,
	"effective_until_period_start_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"metric" "training_goal_metric" NOT NULL,
	"period" "training_goal_period" NOT NULL,
	"sport_scope" "training_goal_sport_scope" NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_note_tag_assignments" (
	"training_note_id" integer NOT NULL,
	"training_note_tag_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_note_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_id" integer,
	"week_start_at" timestamp,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "training_notes_exactly_one_target_check" CHECK (("training_notes"."activity_id" is not null and "training_notes"."week_start_at" is null) or ("training_notes"."activity_id" is null and "training_notes"."week_start_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "weekly_training_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"week_start_at" timestamp NOT NULL,
	"week_end_at" timestamp NOT NULL,
	"generated_at" timestamp NOT NULL,
	"activity_count" integer NOT NULL,
	"total_distance_meters" double precision NOT NULL,
	"total_moving_time_seconds" integer NOT NULL,
	"average_speed_meters_per_second" double precision,
	"previous_week_activity_count_delta" integer NOT NULL,
	"previous_week_distance_delta_meters" double precision NOT NULL,
	"previous_week_moving_time_delta_seconds" integer NOT NULL,
	"previous_week_average_speed_delta_meters_per_second" double precision,
	"longest_activity_id" integer,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_training_summary_generation_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"week_start_at" timestamp NOT NULL,
	"status" "weekly_training_summary_generation_job_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"run_after" timestamp DEFAULT now() NOT NULL,
	"locked_at" timestamp,
	"locked_by" text,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_best_efforts" ADD CONSTRAINT "activity_best_efforts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_best_efforts" ADD CONSTRAINT "activity_best_efforts_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_heart_rate_zone_snapshots" ADD CONSTRAINT "activity_heart_rate_zone_snapshots_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_heart_rate_zone_times" ADD CONSTRAINT "activity_heart_rate_zone_times_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_laps" ADD CONSTRAINT "activity_laps_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_maps" ADD CONSTRAINT "activity_maps_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_route_heatmap_cells" ADD CONSTRAINT "activity_route_heatmap_cells_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_route_heatmap_contributions" ADD CONSTRAINT "activity_route_heatmap_contributions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_route_heatmap_contributions" ADD CONSTRAINT "activity_route_heatmap_contributions_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_streams" ADD CONSTRAINT "activity_streams_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_best_efforts" ADD CONSTRAINT "personal_best_efforts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_best_efforts" ADD CONSTRAINT "personal_best_efforts_activity_best_effort_id_activity_best_efforts_id_fk" FOREIGN KEY ("activity_best_effort_id") REFERENCES "public"."activity_best_efforts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_best_efforts" ADD CONSTRAINT "personal_best_efforts_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_streaks" ADD CONSTRAINT "training_streaks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_best_effort_calculation_jobs" ADD CONSTRAINT "activity_best_effort_calculation_jobs_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_heart_rate_zone_time_calculation_jobs" ADD CONSTRAINT "activity_heart_rate_zone_time_calculation_jobs_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_route_heatmap_calculation_jobs" ADD CONSTRAINT "activity_route_heatmap_calculation_jobs_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_streak_update_jobs" ADD CONSTRAINT "training_streak_update_jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_equipment_uses" ADD CONSTRAINT "activity_equipment_uses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_equipment_uses" ADD CONSTRAINT "activity_equipment_uses_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_equipment_uses" ADD CONSTRAINT "activity_equipment_uses_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "default_equipment" ADD CONSTRAINT "default_equipment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "default_equipment" ADD CONSTRAINT "default_equipment_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heart_rate_zones" ADD CONSTRAINT "heart_rate_zones_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_activities" ADD CONSTRAINT "external_activities_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_activities" ADD CONSTRAINT "external_activities_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_activities" ADD CONSTRAINT "external_activities_last_sync_run_id_sync_runs_id_fk" FOREIGN KEY ("last_sync_run_id") REFERENCES "public"."sync_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_activity_maps" ADD CONSTRAINT "external_activity_maps_external_activity_id_external_activities_id_fk" FOREIGN KEY ("external_activity_id") REFERENCES "public"."external_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_activity_maps" ADD CONSTRAINT "external_activity_maps_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_activity_maps" ADD CONSTRAINT "external_activity_maps_last_sync_run_id_sync_runs_id_fk" FOREIGN KEY ("last_sync_run_id") REFERENCES "public"."sync_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_activity_streams" ADD CONSTRAINT "external_activity_streams_external_activity_id_external_activities_id_fk" FOREIGN KEY ("external_activity_id") REFERENCES "public"."external_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_activity_streams" ADD CONSTRAINT "external_activity_streams_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_activity_streams" ADD CONSTRAINT "external_activity_streams_last_sync_run_id_sync_runs_id_fk" FOREIGN KEY ("last_sync_run_id") REFERENCES "public"."sync_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_connections" ADD CONSTRAINT "provider_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_goal_versions" ADD CONSTRAINT "training_goal_versions_training_goal_id_training_goals_id_fk" FOREIGN KEY ("training_goal_id") REFERENCES "public"."training_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_goals" ADD CONSTRAINT "training_goals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_note_tag_assignments" ADD CONSTRAINT "training_note_tag_assignments_training_note_id_training_notes_id_fk" FOREIGN KEY ("training_note_id") REFERENCES "public"."training_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_note_tag_assignments" ADD CONSTRAINT "training_note_tag_assignments_training_note_tag_id_training_note_tags_id_fk" FOREIGN KEY ("training_note_tag_id") REFERENCES "public"."training_note_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_note_tags" ADD CONSTRAINT "training_note_tags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_notes" ADD CONSTRAINT "training_notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_notes" ADD CONSTRAINT "training_notes_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_training_summaries" ADD CONSTRAINT "weekly_training_summaries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_training_summary_generation_jobs" ADD CONSTRAINT "weekly_training_summary_generation_jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_user_id_idx" ON "activities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activities_user_start_at_idx" ON "activities" USING btree ("user_id","start_at");--> statement-breakpoint
CREATE INDEX "activities_user_sport_type_idx" ON "activities" USING btree ("user_id","sport_type");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_best_efforts_activity_distance_idx" ON "activity_best_efforts" USING btree ("activity_id","standard_distance_code");--> statement-breakpoint
CREATE INDEX "activity_best_efforts_user_distance_duration_idx" ON "activity_best_efforts" USING btree ("user_id","standard_distance_code","duration_seconds");--> statement-breakpoint
CREATE INDEX "activity_best_efforts_activity_id_idx" ON "activity_best_efforts" USING btree ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_hr_zone_snapshots_activity_position_idx" ON "activity_heart_rate_zone_snapshots" USING btree ("activity_id","position");--> statement-breakpoint
CREATE INDEX "activity_hr_zone_snapshots_activity_id_idx" ON "activity_heart_rate_zone_snapshots" USING btree ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_hr_zone_times_activity_position_idx" ON "activity_heart_rate_zone_times" USING btree ("activity_id","position");--> statement-breakpoint
CREATE INDEX "activity_hr_zone_times_activity_id_idx" ON "activity_heart_rate_zone_times" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_laps_activity_id_idx" ON "activity_laps" USING btree ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_laps_activity_index_idx" ON "activity_laps" USING btree ("activity_id","index");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_maps_activity_id_idx" ON "activity_maps" USING btree ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_route_heatmap_cells_user_cell_idx" ON "activity_route_heatmap_cells" USING btree ("user_id","zoom","tile_x","tile_y","cell_x","cell_y");--> statement-breakpoint
CREATE INDEX "activity_route_heatmap_cells_user_tile_idx" ON "activity_route_heatmap_cells" USING btree ("user_id","zoom","tile_x","tile_y");--> statement-breakpoint
CREATE INDEX "activity_route_heatmap_cells_user_zoom_count_idx" ON "activity_route_heatmap_cells" USING btree ("user_id","zoom","activity_count");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_route_heatmap_activity_cell_idx" ON "activity_route_heatmap_contributions" USING btree ("activity_id","zoom","tile_x","tile_y","cell_x","cell_y");--> statement-breakpoint
CREATE INDEX "activity_route_heatmap_user_viewport_idx" ON "activity_route_heatmap_contributions" USING btree ("user_id","zoom","tile_x","tile_y");--> statement-breakpoint
CREATE INDEX "activity_route_heatmap_user_start_at_idx" ON "activity_route_heatmap_contributions" USING btree ("user_id","activity_start_at");--> statement-breakpoint
CREATE INDEX "activity_route_heatmap_activity_id_idx" ON "activity_route_heatmap_contributions" USING btree ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_streams_activity_type_idx" ON "activity_streams" USING btree ("activity_id","stream_type");--> statement-breakpoint
CREATE INDEX "activity_streams_activity_id_idx" ON "activity_streams" USING btree ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "personal_best_efforts_user_distance_idx" ON "personal_best_efforts" USING btree ("user_id","standard_distance_code");--> statement-breakpoint
CREATE INDEX "personal_best_efforts_activity_best_effort_id_idx" ON "personal_best_efforts" USING btree ("activity_best_effort_id");--> statement-breakpoint
CREATE INDEX "personal_best_efforts_activity_id_idx" ON "personal_best_efforts" USING btree ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "training_streaks_user_id_idx" ON "training_streaks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "training_streaks_last_qualified_week_idx" ON "training_streaks" USING btree ("last_qualified_week_start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_best_effort_jobs_activity_id_idx" ON "activity_best_effort_calculation_jobs" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_best_effort_jobs_status_run_after_idx" ON "activity_best_effort_calculation_jobs" USING btree ("status","run_after");--> statement-breakpoint
CREATE INDEX "activity_best_effort_jobs_locked_at_idx" ON "activity_best_effort_calculation_jobs" USING btree ("locked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_hr_zone_time_jobs_activity_id_idx" ON "activity_heart_rate_zone_time_calculation_jobs" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_hr_zone_time_jobs_status_run_after_idx" ON "activity_heart_rate_zone_time_calculation_jobs" USING btree ("status","run_after");--> statement-breakpoint
CREATE INDEX "activity_hr_zone_time_jobs_locked_at_idx" ON "activity_heart_rate_zone_time_calculation_jobs" USING btree ("locked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_route_heatmap_jobs_activity_id_idx" ON "activity_route_heatmap_calculation_jobs" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_route_heatmap_jobs_status_run_after_idx" ON "activity_route_heatmap_calculation_jobs" USING btree ("status","run_after");--> statement-breakpoint
CREATE INDEX "activity_route_heatmap_jobs_locked_at_idx" ON "activity_route_heatmap_calculation_jobs" USING btree ("locked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "training_streak_update_jobs_user_week_idx" ON "training_streak_update_jobs" USING btree ("user_id","week_start_at");--> statement-breakpoint
CREATE INDEX "training_streak_update_jobs_status_run_after_idx" ON "training_streak_update_jobs" USING btree ("status","run_after");--> statement-breakpoint
CREATE INDEX "training_streak_update_jobs_locked_at_idx" ON "training_streak_update_jobs" USING btree ("locked_at");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_equipment_uses_activity_type_idx" ON "activity_equipment_uses" USING btree ("activity_id","equipment_type");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_equipment_uses_activity_equipment_idx" ON "activity_equipment_uses" USING btree ("activity_id","equipment_id");--> statement-breakpoint
CREATE INDEX "activity_equipment_uses_user_id_idx" ON "activity_equipment_uses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_equipment_uses_equipment_id_idx" ON "activity_equipment_uses" USING btree ("equipment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "default_equipment_active_user_type_sport_idx" ON "default_equipment" USING btree ("user_id","equipment_type","sport_type") WHERE "default_equipment"."cleared_at" is null;--> statement-breakpoint
CREATE INDEX "default_equipment_user_id_idx" ON "default_equipment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "default_equipment_equipment_id_idx" ON "default_equipment" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_user_id_idx" ON "equipment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "equipment_user_type_idx" ON "equipment" USING btree ("user_id","equipment_type");--> statement-breakpoint
CREATE INDEX "equipment_retired_at_idx" ON "equipment" USING btree ("retired_at");--> statement-breakpoint
CREATE UNIQUE INDEX "heart_rate_zones_user_position_idx" ON "heart_rate_zones" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "heart_rate_zones_user_id_idx" ON "heart_rate_zones" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_activities_user_provider_activity_id_idx" ON "external_activities" USING btree ("user_id","provider","provider_activity_id");--> statement-breakpoint
CREATE INDEX "external_activities_user_activity_start_at_idx" ON "external_activities" USING btree ("user_id","activity_start_at");--> statement-breakpoint
CREATE INDEX "external_activities_user_provider_idx" ON "external_activities" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "external_activities_provider_athlete_id_idx" ON "external_activities" USING btree ("provider","provider_athlete_id");--> statement-breakpoint
CREATE INDEX "external_activities_last_sync_run_id_idx" ON "external_activities" USING btree ("last_sync_run_id");--> statement-breakpoint
CREATE INDEX "external_activities_deleted_at_idx" ON "external_activities" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "external_activity_maps_activity_id_idx" ON "external_activity_maps" USING btree ("external_activity_id");--> statement-breakpoint
CREATE INDEX "external_activity_maps_user_provider_activity_id_idx" ON "external_activity_maps" USING btree ("user_id","provider","provider_activity_id");--> statement-breakpoint
CREATE INDEX "external_activity_maps_last_sync_run_id_idx" ON "external_activity_maps" USING btree ("last_sync_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_activity_streams_activity_type_idx" ON "external_activity_streams" USING btree ("external_activity_id","stream_type");--> statement-breakpoint
CREATE INDEX "external_activity_streams_user_provider_activity_id_idx" ON "external_activity_streams" USING btree ("user_id","provider","provider_activity_id");--> statement-breakpoint
CREATE INDEX "external_activity_streams_last_sync_run_id_idx" ON "external_activity_streams" USING btree ("last_sync_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_connections_user_provider_user_id_idx" ON "provider_connections" USING btree ("user_id","provider","provider_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_connections_active_user_id_idx" ON "provider_connections" USING btree ("user_id") WHERE "provider_connections"."status" = 'active';--> statement-breakpoint
CREATE INDEX "provider_connections_user_id_idx" ON "provider_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "provider_connections_user_provider_idx" ON "provider_connections" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "provider_connections_status_idx" ON "provider_connections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sync_runs_user_id_idx" ON "sync_runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sync_runs_user_provider_idx" ON "sync_runs" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "sync_runs_status_idx" ON "sync_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sync_runs_started_at_idx" ON "sync_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "training_goal_versions_goal_id_idx" ON "training_goal_versions" USING btree ("training_goal_id");--> statement-breakpoint
CREATE INDEX "training_goal_versions_effective_period_idx" ON "training_goal_versions" USING btree ("training_goal_id","effective_from_period_start_at","effective_until_period_start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "training_goal_versions_goal_from_period_idx" ON "training_goal_versions" USING btree ("training_goal_id","effective_from_period_start_at");--> statement-breakpoint
CREATE INDEX "training_goals_user_id_idx" ON "training_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "training_goals_user_active_idx" ON "training_goals" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE UNIQUE INDEX "training_goals_active_scope_idx" ON "training_goals" USING btree ("user_id","metric","period","sport_scope") WHERE "training_goals"."archived_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "training_note_tag_assignments_note_tag_idx" ON "training_note_tag_assignments" USING btree ("training_note_id","training_note_tag_id");--> statement-breakpoint
CREATE INDEX "training_note_tag_assignments_tag_idx" ON "training_note_tag_assignments" USING btree ("training_note_tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "training_note_tags_user_name_lower_idx" ON "training_note_tags" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX "training_note_tags_user_archived_idx" ON "training_note_tags" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE INDEX "training_notes_user_created_at_idx" ON "training_notes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "training_notes_activity_id_idx" ON "training_notes" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "training_notes_user_week_start_at_idx" ON "training_notes" USING btree ("user_id","week_start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_training_summaries_user_week_idx" ON "weekly_training_summaries" USING btree ("user_id","week_start_at");--> statement-breakpoint
CREATE INDEX "weekly_training_summaries_user_generated_idx" ON "weekly_training_summaries" USING btree ("user_id","generated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_training_summary_jobs_user_week_idx" ON "weekly_training_summary_generation_jobs" USING btree ("user_id","week_start_at");--> statement-breakpoint
CREATE INDEX "weekly_training_summary_jobs_status_run_after_idx" ON "weekly_training_summary_generation_jobs" USING btree ("status","run_after");--> statement-breakpoint
CREATE INDEX "weekly_training_summary_jobs_locked_at_idx" ON "weekly_training_summary_generation_jobs" USING btree ("locked_at");