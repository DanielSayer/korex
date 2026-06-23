# Pack Activity Route Heatmap Contribution Sets

Korex will persist an **Activity Route Heatmap Contribution Set** for each run **Activity** and materialized zoom level. Each set stores sorted, unique global cell keys in one PostgreSQL `bigint[]` rather than storing one database row for every **Activity Route Heatmap Contribution**.

The logical contribution remains one **Activity** passing through one cell. Packing changes only the persistence representation. Replacing or clearing an **Activity's** contribution sets still calculates cell-level deltas and applies them to the user-owned aggregate cells used by map reads.

Aggregate deltas are applied with one set-based upsert and one cleanup statement. The map read path remains independent of contribution-set storage.

**Consequences**

- One qualifying **Activity** stores at most one contribution-set row per materialized zoom.
- Contribution sets retain the parent **User** and **Activity** start time once per zoom for future date-range filtering.
- Cell keys encode global cell X and Y values as safe JavaScript integers stored in PostgreSQL `bigint[]` values.
- Replacing an **Activity Map** reads and unpacks only that **Activity's** existing contribution sets.
- **Activity Route Heatmap** tile reads continue to query aggregate cells and are unaffected by packed contribution storage.
- Existing row-shaped contributions require a reset and raw-**Activity Map** backfill, or a separate two-phase data migration.
- This supersedes ADR-0005's physical one-row-per-contribution representation while preserving its logical contribution invariants.
