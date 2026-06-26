# Web fallow dead and duplicate code audit

Date: 2026-06-26

Scope: `apps/web`

Command:

```powershell
npx fallow
```

## Summary

`fallow` reported:

- 8 unused files
- 11 unused exports
- 2 unused type exports
- 2 unused production dependencies
- 1 unused dev dependency
- 1 duplicate export pair
- 13 clone groups, totalling 551 duplicated lines across 14 files

This audit records candidates only. No feature behavior was changed.

## Dead code candidates

Likely removal candidates:

- `apps/web/pwa-assets.config.ts`
- `apps/web/src/components/mode-toggle.tsx`
- `apps/web/src/features/activities/components/activity-detail/metric-grid.tsx`
- `apps/web/src/features/dashboard/components/last-five-runs-section.tsx`
- `apps/web/src/features/dashboard/components/last-five-runs-skeleton.tsx`
- `apps/web/src/features/dashboard/components/last-five-runs.tsx`
- `apps/web/src/features/dashboard/components/run-card.tsx`
- `apps/web/src/features/dashboard/utils/activity-formatters.ts`

Unused exports worth checking before removal:

- `activity-stream-chart-utils.ts`: `normalizeValue`, `sampleChartPoints`
- `theme-utils.ts`: `convertToThemePreset`, `getThemeName`
- `responsive.ts`: `mobileViewportMediaQuery`
- `calendar-month.ts`: `getActivityWeekKey`, `CalendarAgendaItem`
- `route-heatmap/types.ts`: `routeHeatmapDisplayModes`
- `route-heatmap-style.ts`: `getRouteHeatmapRampColor`
- `apply-theme.ts`: `clearThemeFromElement`
- `formatters.ts`: `formatBpm`
- `orpc.ts`: `client`
- `__root.tsx`: `RouterAppContext`

Dependency candidates:

- `@hookform/resolvers` appears unused in `apps/web`.
- `dotenv` appears unused in `apps/web`.
- `@korex/config` appears unused in `apps/web` dev dependencies.
- `@tailwindcss/vite` and `vite-plugin-pwa` were reported as test-only production dependencies, but these are Vite/plugin dependencies and should be checked against build configuration before moving.

## Repeated code candidates for extraction

Recommended extraction candidates:

- Training note tag styles are duplicated between `src/features/settings/components/training-note-tags-styles.ts` and `src/features/training-notes/components/training-note-utils.ts`. Extract the shared color list, class map, swatch map, and lookup helpers into one training-note tag utility module.
- Training goal update/archive mutation setup is duplicated between `TrainingGoalActions` and `TrainingGoalMobileActions` in `src/features/training-goals/components/training-goal-list.tsx`. Extract a local hook such as `useTrainingGoalActions(goal, options)` to centralize query invalidation, toast handling, and mutation creation while keeping the desktop/mobile UI separate.
- Auth form fields duplicate the same label/input/error structure in `src/components/auth/sign-in.tsx` and `src/components/auth/sign-up-account-step.tsx`. A small auth-local field component would reduce repeated markup without changing form behavior.
- Analytics distance charts duplicate chart container, grid, axes, tooltip formatting, and margins across `bucket-distance-chart.tsx` and `cumulative-distance-chart.tsx`. A shared chart shell or axis helper would remove repeated wiring while leaving Bar/Line specifics in place.
- Pace formatting is duplicated between `dashboard-metrics.tsx` and `recent-runs-table.tsx`. Move `formatPaceSeconds` into `src/utils/formatters.ts` if follow-up changes touch either area.

Lower-priority or probably intentional duplication:

- `dashboard-desktop.tsx` and `dashboard-mobile.tsx` share dashboard data composition but diverge heavily in layout. Extracting this now risks creating layout-oriented abstraction without much payoff.
- `sign-in.lazy.tsx` and `sign-up.lazy.tsx` duplicate the auth page shell. A shared shell is possible, but the sign-up route owns step-specific imagery and state, so this is lower priority than field-level auth duplication.
- `dashboard-metrics.tsx` and `recent-runs-table.tsx` share metric presentation patterns. Prefer extracting formatter helpers first; a UI abstraction may be premature.

## Suggested order

1. Remove or suppress confirmed dead files/exports after checking route/plugin entry points.
2. Consolidate training note tag style helpers.
3. Extract training goal mutation handling into a local hook.
4. Extract auth field markup if auth work continues.
5. Extract chart shell helpers only if more analytics charts are added.
