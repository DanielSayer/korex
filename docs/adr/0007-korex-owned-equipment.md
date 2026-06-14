# Use Korex-owned Equipment instead of provider gear as source of truth

Korex stores **Equipment** and **Activity Equipment Uses** as user-owned core data rather than relying on provider gear. Provider gear APIs are unavailable or incomplete for the current workflow: COROS gear is not visible through the Intervals.icu gear endpoint for the connected account, and Garmin/COROS public API access does not provide a dependable gear source. Korex may use provider gear as an import hint later, but user-owned **Equipment** remains the source of truth.
