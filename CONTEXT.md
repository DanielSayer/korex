# Korex Context

Korex imports external training data and translates it into user-owned fitness data for analysis and editing inside the core domain.

## Language

**Heart Rate Zone**:
A user-owned heart-rate intensity range with a display name, ordered position, lower beats-per-minute bound, and optional upper beats-per-minute bound.
_Avoid_: Heart rate bucket, HR bucket

**Provider Profile**:
The athlete identity and settings returned by an external provider connection.
_Avoid_: Core profile, user profile

**Intervals.icu**:
An upstream training data provider, comparable to Strava.
_Avoid_: Intervals, interval training

**Anti-Corruption Layer**:
A boundary component that translates external provider data into Korex domain data.
_Avoid_: Normalizer, mapper, adapter, passthrough

**Activity**:
A user-owned workout or training session imported from an external provider for analysis inside Korex.
_Avoid_: External activity, provider activity

**Activity Lap**:
A core-owned sequential segment of an **Activity**, imported from provider lap or split data for analysis inside Korex.
_Avoid_: Provider lap, external lap, split

**Activity Map**:
A core-owned ordered route for an **Activity**, imported from provider map data for route display inside Korex.
_Avoid_: Provider map, external map, raw route

**Activity Stream**:
A core-owned ordered numeric series for an **Activity**, imported from provider stream data for point-by-point analysis inside Korex.
_Avoid_: Provider stream, external stream, raw stream

**Activity Heart Rate Zone Time**:
A point-in-time duration summary for an **Activity** calculated from heart-rate data using a snapshot of the user's **Heart Rate Zones** at calculation time.
_Avoid_: Provider zone time, live zone time

**Activity Heart Rate Zone Snapshot**:
The historical **Heart Rate Zone** name, position, and beats-per-minute bounds captured for an **Activity** before zone-time calculation.
_Avoid_: Pending zone time, copied zone

**Activity Map Coordinate**:
A latitude and longitude pair in an **Activity Map**.
_Avoid_: Latlng, point, GPS row

**Sport Type**:
A Korex-owned classification for an **Activity**, initially limited to run, treadmill, and hike.
_Avoid_: Provider sport, provider type, category

**Device Name**:
An optional display label for the device or app associated with an **Activity**.
_Avoid_: Device identity, recording source

**Provider Activity Metadata**:
The upstream identifiers, timestamps, and raw payload retained for an imported **Activity**.
_Avoid_: Activity fields, core activity data

**Incremental Activity Sync Watermark**:
The timestamp used as the lower bound for the next incremental activity sync window.
_Avoid_: Last finished sync time, cursor timestamp

**Weekly Training Summary**:
A stored point-in-time summary of a user's training week, calculated from that week's **Activities** for later listing and replay.
_Avoid_: Wrapped, weekly report, generated artifact

**Training Week**:
A Monday-start calendar week used to group **Activities** for weekly analysis.
_Avoid_: Calendar week, ISO week, reporting week

## Relationships

- A **Heart Rate Zone** belongs to exactly one **User**
- A **Provider Profile** can seed one or more **Heart Rate Zones**
- A **Heart Rate Zone** remains user-owned after it is seeded from a **Provider Profile**
- A **Provider Profile** is only a source of defaults for **Heart Rate Zones**, not ongoing provenance.
- **Heart Rate Zones** for the same **User** must not overlap; gaps are allowed.
- A **User** has one active set of **Heart Rate Zones**.
- An **Anti-Corruption Layer** translates **Provider Profile** heart-rate zone data into **Heart Rate Zones**.
- An **Activity** belongs to exactly one **User**.
- An **Activity** has exactly one **Sport Type**.
- An **Activity** can have zero or more **Activity Laps**.
- An **Activity** can have zero or one **Activity Map**.
- An **Activity** can have zero or more **Activity Streams**.
- An **Activity Lap** belongs to exactly one **Activity**.
- An **Activity Map** belongs to exactly one **Activity**.
- An **Activity Stream** belongs to exactly one **Activity**.
- Each **Activity** can have only one **Activity Stream** for a given stream type.
- **Activity Streams** are initially limited to cadence, distance, altitude, heart rate, and velocity.
- Intervals.icu cadence stream values are revolutions per minute and become steps per minute in Korex by doubling each value.
- An **Activity** can have zero or more **Activity Heart Rate Zone Times**.
- An **Activity** can have zero or more **Activity Heart Rate Zone Snapshots**.
- An **Activity Heart Rate Zone Snapshot** belongs to exactly one **Activity**.
- An **Activity Heart Rate Zone Time** belongs to exactly one **Activity**.
- **Activity Heart Rate Zone Snapshots** preserve the **Heart Rate Zone** name, position, and beats-per-minute bounds used for calculation.
- **Activity Heart Rate Zone Times** are calculated from **Activity Heart Rate Zone Snapshots** and the heart-rate **Activity Stream**.
- **Activity Heart Rate Zone Snapshots** and **Activity Heart Rate Zone Times** are historical data and must not change when the user's active **Heart Rate Zones** change later.
- **Activity Heart Rate Zone Snapshots** are captured when the heart-rate **Activity Stream** is successfully stored during import.
- An **Activity** without a heart-rate **Activity Stream** does not have **Activity Heart Rate Zone Snapshots**.
- **Activity Heart Rate Zone Times** may be materialized after import, but delayed calculation must use the captured **Activity Heart Rate Zone Snapshots**.
- When a heart-rate **Activity Stream** changes on re-sync, Korex replaces the **Activity Heart Rate Zone Snapshots** and **Activity Heart Rate Zone Times** for that **Activity** as a set.
- Heart-rate samples outside all captured **Activity Heart Rate Zone Snapshots** do not contribute to **Activity Heart Rate Zone Times**.
- **Activity Heart Rate Zone Times** calculate sample duration from the **Activity** moving duration divided by the number of heart-rate samples, rounded to the nearest whole second.
- Heart-rate sample frequency is treated as recording-device behavior, not provider behavior.
- Provider-reported heart-rate zone durations are not **Activity Heart Rate Zone Times** unless Korex can prove they were calculated from the same **Heart Rate Zones**.
- An **Activity Map** has one or more ordered **Activity Map Coordinates**.
- An **Activity Map** may store nullable bounds as display metadata; coordinates are the domain value.
- **Activity Map Coordinates** must be valid latitude and longitude pairs.
- When provider map data changes on re-sync, Korex replaces the **Activity Map** for that **Activity** as a single value.
- Malformed provider map data does not update or delete an existing **Activity Map**, and does not prevent the parent **Activity** from importing.
- A missing provider map payload does not delete an existing **Activity Map**.
- **Activity Laps** are ordered by a zero-based index within an **Activity**.
- Each **Activity** can have only one **Activity Lap** for a given index.
- **Activity Lap** start and end times are stored as second offsets from the parent **Activity** start.
- The first **Activity Lap** starts at offset `0`; each following **Activity Lap** starts when the previous **Activity Lap** ends.
- **Activity Laps** imported from Intervals.icu come from `icu_intervals` on the activity payload.
- All contiguous Intervals.icu `icu_intervals` objects become **Activity Laps**; provider interval type does not filter inclusion.
- Every **Activity Lap** must have an end time offset.
- Every **Activity Lap** must have a distance in meters.
- **Activity Lap** moving and elapsed durations are optional summary metrics, not segment boundaries.
- **Activity Lap** summary metrics such as speed, heart rate, cadence, stride length, and elevation gain are optional.
- An **Activity** can have a **Device Name**, but **Device Name** is display-only and must not drive identity, deduplication, or analytics.
- An **Activity** can retain **Provider Activity Metadata** as import provenance, but **Provider Activity Metadata** is not part of the **Activity** identity inside Korex.
- An imported provider activity that maps successfully creates or updates one **Activity**; cross-provider duplicate detection is intentionally deferred.
- **Provider Activity Metadata** may reference the **Activity** it produced, but an **Activity** does not reference provider metadata.
- An **Anti-Corruption Layer** translates provider activity data into an **Activity**.
- An **Anti-Corruption Layer** translates provider lap or split data into **Activity Laps**.
- An **Anti-Corruption Layer** translates provider stream data into **Activity Streams**.
- Provider activity data with an unsupported **Sport Type** is retained as **Provider Activity Metadata** but does not become an **Activity**.
- If updated provider activity data changes to an unsupported **Sport Type**, its **Provider Activity Metadata** no longer references an **Activity**; malformed provider data leaves any existing **Activity** unchanged.
- Malformed provider lap or split data, including non-contiguous **Activity Lap** offsets, does not produce **Activity Laps**.
- When provider lap or split data changes on re-sync, Korex replaces the **Activity Laps** for that **Activity** as a set after the **Activity** is stored.
- Storing an **Activity**, replacing its **Activity Laps**, and linking **Provider Activity Metadata** should happen atomically.
- If **Activity Lap** translation fails, Korex retains **Provider Activity Metadata** but skips the core **Activity** update and **Activity Lap** replacement.
- An **Anti-Corruption Layer** may map fields, convert units, coerce invalid optional metrics to empty values, and choose default **Activity** names; it must not calculate derived **Activity** metrics.
- An **Incremental Activity Sync Watermark** is the `started_at` timestamp of the latest successful activity sync run, not its `finished_at` timestamp.
- Incremental activity sync deliberately overlaps the previous successful sync window so provider changes made during that previous run are not missed.
- Incremental activity sync requires a previous successful activity sync run; it must not silently fall back to initial sync behavior.
- A user can start an incremental activity sync at most once every five minutes.
- Failed incremental activity sync attempts still count toward the five-minute incremental sync rate limit.
- A **Weekly Training Summary** belongs to exactly one **User**.
- A **Weekly Training Summary** is calculated from **Activities** within one **Training Week**.
- A **Weekly Training Summary** is stored so the user can list and replay previous training weeks.
- A **Weekly Training Summary** preserves when it was generated so the user can understand what imported **Activities** were available at that point in time.
- A **Weekly Training Summary** includes comparisons against the previous **Training Week** when previous-week **Activity** data is available.
- **Weekly Training Summary** previous-week comparisons are calculated from previous-week **Activities** at generation time, not from another stored **Weekly Training Summary**.
- A **User** can have at most one current **Weekly Training Summary** for a given **Training Week**.
- **Weekly Training Summaries** are generated only for completed **Training Weeks**, not the current in-progress week.
- Scheduled **Weekly Training Summary** generation targets the immediately completed **Training Week**.
- Scheduled **Weekly Training Summary** generation enqueues durable generation jobs; worker processes calculate and store the summaries.
- A **Weekly Training Summary** can be regenerated for a specific week by user action when the stored snapshot no longer reflects the user's expected imported **Activities**.
- Scheduled **Weekly Training Summary** generation only creates summaries for users with at least one **Activity** in the completed **Training Week**.
- **Training Weeks** currently use the Australia/Brisbane timezone until Korex supports a user-defined timezone setting.

## Example dialogue

> **Dev:** "When Intervals.icu returns heart-rate zones during profile sync, do those remain Intervals settings?"
> **Domain expert:** "No. They become Korex **Heart Rate Zones** for that **User**, and the user can edit them later."

## Flagged ambiguities

- "heart rate bucket" was used for the same concept as **Heart Rate Zone**; resolved: use **Heart Rate Zone** in domain language.
- "Intervals" can mean the upstream provider **Intervals.icu** or interval running training; resolved: use **Intervals.icu** for the provider and avoid bare "intervals" in domain language.
- "activity" can mean either the provider record or the Korex-owned workout; resolved: use **Activity** for the Korex domain object and **Provider Activity Metadata** only for upstream provenance.
- "lap" and "split" can refer to provider-shaped segment records; resolved: use **Activity Lap** for the Korex-owned segment of an **Activity**.
- "zone time" can mean provider-reported durations or Korex-calculated activity summaries; resolved: use **Activity Heart Rate Zone Time** only for point-in-time durations calculated by Korex.
- "pending zone time" was considered for captured zones awaiting calculation; resolved: use **Activity Heart Rate Zone Snapshot** for the captured historical zone definition and **Activity Heart Rate Zone Time** only for calculated durations.
- "last sync time" can mean when a sync started, finished, or last wrote provider connection metadata; resolved: use **Incremental Activity Sync Watermark** for the lower bound of an incremental activity sync window.
