# Heart Rate Zones

Heart Rate Zones are core Korex data owned by the user. Upstream provider data can seed this module, but provider response shapes must be translated through an Anti-Corruption Layer before they reach core Heart Rate Zone writes.

## Anti-Corruption Layers

Provider-specific ACLs live under `anti-corruption/`:

- `anti-corruption/intervals-icu-profile.acl.ts` translates Intervals.icu profile heart-rate zone data into Heart Rate Zone seed inputs.

The Intervals.icu ACL should only be used to create defaults when the user has no Heart Rate Zones. Existing Heart Rate Zones are not provider-owned and should not be overwritten by profile sync.
