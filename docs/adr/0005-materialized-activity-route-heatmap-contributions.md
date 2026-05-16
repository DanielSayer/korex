# Materialize Activity Route Heatmap Contributions

Korex will display an **Activity Route Heatmap** by querying materialized **Activity Route Heatmap Contributions**, not by aggregating raw **Activity Map Coordinates** during UI requests. A contribution records that one run **Activity** passed through one 64 by 64 cell inside a slippy-map tile at one materialized zoom level. Heatmap reads return grouped cells for a requested viewport, while **Activity Maps** remain the canonical route data for single-Activity display.

This keeps heatmap reads bounded by viewport and zoom, avoids parsing large `activity_maps.coordinates` payloads on every request, and preserves correct re-sync behavior. When a run **Activity Map** is replaced, Korex replaces that **Activity's** contributions as a set. When an **Activity** no longer qualifies for the heatmap, Korex removes that **Activity's** contributions. Malformed or missing provider map data that preserves the existing **Activity Map** leaves existing contributions unchanged.

**Consequences**

- **Activity Maps** remain stored for per-Activity route display and future SVG previews.
- **Activity Route Heatmap Contributions** are derived query data, not the canonical route.
- The initial heatmap includes run **Activities** only.
- The initial heatmap is exposed only through a private authenticated endpoint for the current user.
- Heatmap density counts distinct **Activities** per cell, not raw coordinate sample density.
- Contributions are calculated by separate durable jobs after **Activity Map** replacement, rather than inside provider sync request or import transaction lifetimes.
- Contributions are calculated by rasterizing consecutive **Activity Map Coordinate** segments through tile cells, not by bucketing isolated coordinate samples.
- Route geometry may be simplified per materialized zoom during contribution calculation, but canonical **Activity Maps** are not simplified or rewritten for heatmap performance.
- Existing run **Activity Maps** are backfilled by enqueueing durable contribution calculation jobs and letting the normal worker process them.
- Contributions store the parent **Activity** start time so future date range filtering can avoid joining every contribution row back to `activities`.
- Contributions enforce uniqueness for each **Activity**, zoom, tile, and cell so one **Activity** contributes to a cell at most once.
- Contribution calculation jobs are unique by **Activity** and process the latest qualifying **Activity Map** state when claimed.
- The initial read API returns grouped cells for a requested viewport, not raw contribution rows.
- The initial read API should cap requested viewport size by tile count, starting with a hardcoded limit that can be tuned after real performance measurements.
- The heatmap API accepts only materialized integer zoom levels; smooth map zooming is handled by the frontend reusing or transitioning between integer heatmap layers.
- The first implementation materializes slippy-map zoom levels 4 through 15 inclusive for global discovery and local detail.
- Aggregate-only per-user cell counts are deferred because they make map replacement, deletion, sport changes, and future date filtering harder to keep correct.
- Tile-shaped heatmap endpoints can be added later over the same contribution table if the frontend map layer needs tile-based loading.
