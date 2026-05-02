# Use core-owned Heart Rate Zones seeded through an Anti-Corruption Layer

Korex stores heart-rate intensity ranges as user-owned **Heart Rate Zones** in the core domain, not as **Intervals.icu** provider metadata. **Intervals.icu** profile sync may seed **Heart Rate Zones** through an **Anti-Corruption Layer** when the user has no zones, but after creation the zones are Korex data and are not tied to provider provenance. This keeps upstream provider shapes out of the core model while still using provider data as better defaults than invented zones.
