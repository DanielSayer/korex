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

**Sport Type**:
A Korex-owned classification for an **Activity**, initially limited to run, treadmill, and hike.
_Avoid_: Provider sport, provider type, category

**Device Name**:
An optional display label for the device or app associated with an **Activity**.
_Avoid_: Device identity, recording source

**Provider Activity Metadata**:
The upstream identifiers, timestamps, and raw payload retained for an imported **Activity**.
_Avoid_: Activity fields, core activity data

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
- An **Activity Lap** belongs to exactly one **Activity**.
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
- Provider activity data with an unsupported **Sport Type** is retained as **Provider Activity Metadata** but does not become an **Activity**.
- If updated provider activity data changes to an unsupported **Sport Type**, its **Provider Activity Metadata** no longer references an **Activity**; malformed provider data leaves any existing **Activity** unchanged.
- Malformed provider lap or split data, including non-contiguous **Activity Lap** offsets, does not produce **Activity Laps**.
- When provider lap or split data changes on re-sync, Korex replaces the **Activity Laps** for that **Activity** as a set after the **Activity** is stored.
- Storing an **Activity**, replacing its **Activity Laps**, and linking **Provider Activity Metadata** should happen atomically.
- If **Activity Lap** translation fails, Korex retains **Provider Activity Metadata** but skips the core **Activity** update and **Activity Lap** replacement.
- An **Anti-Corruption Layer** may map fields, convert units, coerce invalid optional metrics to empty values, and choose default **Activity** names; it must not calculate derived **Activity** metrics.

## Example dialogue

> **Dev:** "When Intervals.icu returns heart-rate zones during profile sync, do those remain Intervals settings?"
> **Domain expert:** "No. They become Korex **Heart Rate Zones** for that **User**, and the user can edit them later."

## Flagged ambiguities

- "heart rate bucket" was used for the same concept as **Heart Rate Zone**; resolved: use **Heart Rate Zone** in domain language.
- "Intervals" can mean the upstream provider **Intervals.icu** or interval running training; resolved: use **Intervals.icu** for the provider and avoid bare "intervals" in domain language.
- "activity" can mean either the provider record or the Korex-owned workout; resolved: use **Activity** for the Korex domain object and **Provider Activity Metadata** only for upstream provenance.
- "lap" and "split" can refer to provider-shaped segment records; resolved: use **Activity Lap** for the Korex-owned segment of an **Activity**.
