DROP INDEX "activity_route_heatmap_activity_cell_idx";--> statement-breakpoint
DROP INDEX "activity_route_heatmap_user_viewport_idx";--> statement-breakpoint
DROP INDEX "activity_route_heatmap_user_start_at_idx";--> statement-breakpoint
DROP INDEX "activity_route_heatmap_activity_id_idx";--> statement-breakpoint
ALTER TABLE "activity_route_heatmap_contributions" ADD COLUMN "cell_keys" bigint[] NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "activity_route_heatmap_contribution_sets_activity_zoom_idx" ON "activity_route_heatmap_contributions" USING btree ("activity_id","zoom");--> statement-breakpoint
CREATE INDEX "activity_route_heatmap_contribution_sets_user_start_at_idx" ON "activity_route_heatmap_contributions" USING btree ("user_id","activity_start_at");--> statement-breakpoint
ALTER TABLE "activity_route_heatmap_contributions" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "activity_route_heatmap_contributions" DROP COLUMN "tile_x";--> statement-breakpoint
ALTER TABLE "activity_route_heatmap_contributions" DROP COLUMN "tile_y";--> statement-breakpoint
ALTER TABLE "activity_route_heatmap_contributions" DROP COLUMN "cell_x";--> statement-breakpoint
ALTER TABLE "activity_route_heatmap_contributions" DROP COLUMN "cell_y";--> statement-breakpoint
ALTER TABLE "activity_route_heatmap_contributions" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "activity_route_heatmap_contributions" DROP COLUMN "updated_at";