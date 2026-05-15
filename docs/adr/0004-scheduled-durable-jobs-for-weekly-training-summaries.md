# Use scheduled durable jobs for Weekly Training Summaries

Korex stores one **Weekly Training Summary** per user per completed **Training Week** so users can list and replay historical training snapshots. We will generate these through a scheduled task that enqueues durable database-backed jobs, with `apps/worker` calculating and storing summaries, rather than calculating directly in the scheduler, activity sync, or UI request path. This keeps weekly summaries predictable as a historical artifact while preserving retries, failure visibility, idempotency, and a future path for user-triggered regeneration of a specific week.

**Consequences**

- Scheduled generation targets only the immediately completed **Training Week**.
- Scheduled generation creates summaries only for users with at least one **Activity** in that **Training Week**.
- The scheduler only enqueues generation work; summary calculation logic lives in `packages/api` and runs from `apps/worker`.
- **Weekly Training Summaries** are point-in-time snapshots with `generated_at`, not live views over current activity data.
- Previous-week comparisons are calculated from previous-week **Activities** at generation time, not from another stored **Weekly Training Summary**.
- For v1, **Training Weeks** use the Australia/Brisbane timezone until Korex supports a user-defined timezone setting.
