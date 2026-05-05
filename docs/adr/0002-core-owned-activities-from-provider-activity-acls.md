# Use core-owned Activities produced through provider activity Anti-Corruption Layers

Korex stores imported workouts as user-owned **Activities** in the core domain, not as provider-shaped records. Provider sync stores upstream identifiers, timestamps, and raw payloads as **Provider Activity Metadata**, then a provider-specific **Anti-Corruption Layer** translates supported provider activity data into an **Activity** with Korex-owned **Sport Type** values and canonical units. This keeps provider vocabulary and raw payload shape out of the core Activity model while still allowing provider updates to re-run the translation and refresh the Activity.

**Consequences**

- `activities` is the core table for **Activities**.
- `external_activities.activity_id` may point to the **Activity** produced from a provider record; **Activities** do not point back to provider metadata.
- Unsupported provider sport types remain stored as provider metadata and do not create **Activities**.
- Cross-provider duplicate detection is intentionally deferred; for now, one supported provider activity produces one **Activity**.
- The Activity ACL is translation-only: it may map fields, convert units, coerce invalid optional metrics to empty values, and choose default names, but it must not calculate derived metrics such as average speed, elevation, or training load.
