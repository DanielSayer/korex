# Use a durable worker for activity derived metrics

Korex calculates **Activity Heart Rate Zone Times** as derived core data after activity import, using captured **Activity Heart Rate Zone Snapshots** and stored heart-rate **Activity Streams**. We will run this through a durable database-backed job and a separate `apps/worker` process rather than calculating inside provider Anti-Corruption Layers, HTTP request lifetimes, or UI render paths. This keeps provider translation pure, makes delayed calculation explicit, and preserves work across server restarts without introducing external queue infrastructure before it is needed.

**Consequences**

- `apps/worker` owns process startup and polling, but calculation logic lives in `packages/api`.
- Postgres stores pending work and claim state.
- Activity import enqueues calculation work after replacing the heart-rate **Activity Stream** and capturing **Activity Heart Rate Zone Snapshots**.
- Failed jobs retry automatically with short backoff intervals of 1, 2, then 4 seconds before remaining failed for manual or later recovery.
- Replacing a heart-rate **Activity Stream**, replacing **Activity Heart Rate Zone Snapshots**, deleting stale **Activity Heart Rate Zone Times**, and enqueueing the calculation job happen in the same database transaction.
- Every heart-rate **Activity Stream** replacement enqueues calculation work; Korex does not diff stream payloads before deciding whether derived zone times are stale.
- Worker batch size, poll interval, and stale-lock timeout start as hardcoded constants because this is the first background workflow and the operational tuning needs are not yet proven.
- Workers recover abandoned processing jobs through stale locks: a processing job whose `locked_at` is older than the stale-lock timeout can be claimed again.
