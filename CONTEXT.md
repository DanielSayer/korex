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

## Relationships

- A **Heart Rate Zone** belongs to exactly one **User**
- A **Provider Profile** can seed one or more **Heart Rate Zones**
- A **Heart Rate Zone** remains user-owned after it is seeded from a **Provider Profile**
- A **Provider Profile** is only a source of defaults for **Heart Rate Zones**, not ongoing provenance.
- **Heart Rate Zones** for the same **User** must not overlap; gaps are allowed.
- A **User** has one active set of **Heart Rate Zones**.
- An **Anti-Corruption Layer** translates **Provider Profile** heart-rate zone data into **Heart Rate Zones**.

## Example dialogue

> **Dev:** "When Intervals.icu returns heart-rate zones during profile sync, do those remain Intervals settings?"
> **Domain expert:** "No. They become Korex **Heart Rate Zones** for that **User**, and the user can edit them later."

## Flagged ambiguities

- "heart rate bucket" was used for the same concept as **Heart Rate Zone**; resolved: use **Heart Rate Zone** in domain language.
- "Intervals" can mean the upstream provider **Intervals.icu** or interval running training; resolved: use **Intervals.icu** for the provider and avoid bare "intervals" in domain language.
