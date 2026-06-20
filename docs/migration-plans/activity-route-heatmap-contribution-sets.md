# Activity Route Heatmap Contribution Set Migration

## Selected plan

Use a short maintenance window and rebuild derived **Activity Route Heatmap** data from canonical **Activity Maps**. The current data set backfilled 54 qualifying Activities in approximately 10 seconds on the isolated development clone.

The generated migration assumes `activity_route_heatmap_contributions` is empty. It cannot transform populated cell rows into packed arrays by itself.

## Prerequisites

1. Back up the database.
2. Confirm qualifying run Activities retain their canonical `activity_maps.coordinates` values.
3. Stop the server and worker so no heatmap calculation jobs run during the schema change.
4. Inspect `drizzle.__drizzle_migrations`. Existing databases created with `db:push` may have an empty journal. Baseline migration `0000` with the deployment environment's migration tooling before asking `db:migrate` to apply `0001`.

Do not run the complete migration history against an existing schema with an empty journal.

## Deployment

1. Truncate `activity_route_heatmap_contributions`.
2. Apply generated migration `0001_pack_heatmap_contributions.sql`.
3. Run:

   ```powershell
   pnpm --filter worker run backfill:route-heatmap -- --reset
   ```

   The explicit `--reset` guard clears aggregate cells and packed contribution sets before enqueueing every qualifying run Activity and processing the durable jobs.

4. Verify:
   - every backfill job succeeded;
   - `sum(cardinality(cell_keys))` equals `sum(activity_count)`;
   - the signed-in Density and Visited heatmaps render at expected locations;
   - no aggregate cell has `activity_count <= 0`.
5. Restart the server and worker.

## Availability

The heatmap is unavailable during the reset and backfill. Other canonical Activity data is unchanged. A zero-downtime migration would require a temporary second contribution table, a packing data migration, dual-write or cutover logic, and a later cleanup migration. That complexity is not justified for the current data volume.

## Rollback

Restore the pre-migration database backup. The packed schema cannot be read by the old application version.
