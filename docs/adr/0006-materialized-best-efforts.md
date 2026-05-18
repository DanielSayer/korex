# Materialize Activity and Personal Best Efforts

Korex will calculate **Activity Best Efforts** from paired distance and elapsed-time **Activity Streams**, then materialize **Personal Best Efforts** as the fastest known **Activity Best Effort** per user and standard distance. We store both projections because replacing, deleting, or disqualifying one **Activity** must not require rescanning all historical streams to find the next user-level best.

**Consequences**

- Best-effort calculation runs through an activity-scoped durable job, not provider Anti-Corruption Layers, sync request lifetimes, or UI reads.
- **Activity Best Efforts** are replaced as a set for the changed **Activity**.
- The same job refreshes affected **Personal Best Efforts** so the user-level projection stays aligned with per-Activity candidates.
- Standard distances are identified by code rather than raw distance meters to avoid float identity issues for mile and half-marathon distances.
- Activities with missing or unreliable distance and elapsed-time streams produce no **Activity Best Efforts**.
