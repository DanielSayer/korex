# Korex Design Philosophy

> **Trail Telemetry** — a running coach in your pocket, not a dashboard.

This document outlines the visual identity and design principles for Korex. It is
the source of truth for *why* the UI looks the way it does. It currently reflects
the mobile dashboard, which is the reference implementation for the wider app.

---

## 1. Core idea

Korex turns raw training data into something a runner *feels* ownership over.
The interface should feel like an outdoor, map-derived coaching tool — warm,
confident, and physical — not a generic SaaS admin panel.

Identity comes from **form, type, motif, and voice**, never from adding new
colors. The existing warm palette is fixed; personality is earned through
hierarchy, typography, a recurring motif, and tone.

---

## 2. Principles

1. **Numbers are heroes.** Distance, pace, and counts are the product. Set them
   large in the display face with tiny units. Celebrate the stat.
2. **Fewer surfaces, more rhythm.** Avoid boxing every widget in a card. Use
   whitespace, hairline dividers, and one signature motif to separate content.
3. **The motif is the brand.** The ascending route line + waypoint dot recurs
   everywhere: streak tracks, accents, list bullets, active states.
4. **Speak like a coach.** Terse, second-person, imperative. "Build." "Let's
   move." "Your trail starts here." Confidence over chrome.
5. **Map-derived texture.** The app is about routes. Lean on trail/map language —
   stride lines, waypoints, tracks — for decoration instead of abstract shapes.
6. **Color is locked.** No new hues. Express state and emphasis through weight,
   scale, opacity, and the primary accent only.

---

## 3. Brand DNA (the raw material)

- **Domain:** trail/road running telemetry — routes, heatmaps, streaks, weekly
  rhythm, personal bests. Map-derived data is the whole product.
- **Palette:** warm sand background, **clay/amber primary**, deep teal-green
  sidebar. Earthy and outdoorsy, deliberately not techy-blue.
- **Imagery:** golden-hour trail runners and mountains (`public/dashboard/*`).
- **The mark** (`public/pwa-icon.svg`): two ascending diagonal strokes ending in
  **waypoint dots** — a stylized route climbing up-right. This is the seed of the
  whole system.

> **Known tension:** the logo uses vivid green/yellow while the app theme is warm
> amber. We reconcile this by treating the *route + waypoint form* as the brand,
> not the logo's specific colors. Revisit if/when the mark is reworked.

---

## 4. Typography

| Role | Family | Usage |
| --- | --- | --- |
| Display | **Bricolage Grotesque Variable** (`font-display`) | Headlines, hero titles, big stat numbers, section labels, wordmark |
| Body | **Inter Variable** (`font-sans`) | Paragraphs, labels, UI controls |

- Big numbers use `font-display` + `tabular-nums`.
- Section labels: `font-display`, uppercase, `tracking-[0.18em]`, muted.
- Tokens live in `packages/ui/src/styles/globals.css` (`--font-display`).

Tradeoff: one extra font dependency in exchange for a distinct, athletic voice.

---

## 5. The motif system

The route line + waypoint, implemented in `apps/web/src/components/brand.tsx`:

- **`RouteAccent`** — ascending line ending in a filled dot. Sits under hero
  titles as a signature flourish.
- **`StrideTexture`** — the icon's diagonal stride lines as a faded, masked CSS
  texture on hero surfaces. Themed via `--primary`, no raster asset.
- **`SectionLabel`** — consistent display-font, tracked, uppercase headers.
  Used everywhere instead of ad-hoc headings.
- **`WaypointDot`** — the core brand mark, filled or hollow. Filled marks a
  point on the trail; hollow marks a future point. Use sparingly: active tab
  indicator, list bullets on a spine, streak markers. Never decorative spam.
- **`RouteProgress`** — a hairline trail with a waypoint dot climbing to the
  progress %. Replaces generic progress bars.
- **Waypoint track** — the weekly streak rendered as dots on a connecting line;
  a filled waypoint means a qualifying activity. The trail *is* the data.
- **Route-dot bullets** — list items use a small primary dot, echoing waypoints.
- **Trail spine** — a vertical hairline route tying dashboard sections together
  as waypoints (dashboard-only; not a shared primitive).

Reuse these before inventing new decoration.

---

## 6. Layout & surfaces

- Page is a vertical flow: `flex flex-col gap-7 p-4`. Generous, calm spacing.
- **One** prominent surface — the Weekly Focus hero (`rounded-3xl bg-primary/5`
  + stride texture). Everything else is open content with dividers.
- Prefer hairline dividers (`divide-border/30`) and section labels over cards.
- Radii skew large and soft (`rounded-3xl` on the hero) for an approachable feel.

---

## 7. Voice & tone

- Terse, imperative, encouraging. Sentence fragments are fine.
- Time-aware and human ("Tuesday morning. Let's move.").
- Empty states reframe absence as a beginning, not an error ("Your trail starts
  here.").
- Never corporate, never apologetic.

---

## 8. Imagery & placeholders

Most identity is code-driven (SVG/CSS) so it stays themeable and lightweight.
Raster art is used only where it genuinely helps (empty states, optional
photography). Placeholder assets live in `public/brand/` with descriptive
`alt` text and can be regenerated without touching code:

- `public/brand/empty-trail.svg` — minimal trail + waypoint for the recent-runs
  empty state.

When commissioning art, match the warm golden-hour, earthy, motion-led tone of
the existing hero imagery.

---

## 9. Scope & status

- **Implemented (mobile):** the full mobile app now follows Trail Telemetry:
  dashboard, calendar, analytics, goals, activity detail, weekly summaries
  (list + detail), settings (layout + hub + sub-routes), heatmap, more hub,
  auth (sign-in + sign-up), and the bottom tab bar.
- **Shared primitives:** `components/brand.tsx` exports `RouteAccent`,
  `StrideTexture`, `SectionLabel`, `WaypointDot`, and `RouteProgress`.
- **Not yet aligned:** desktop dashboard and desktop-specific layouts still use
  pre-identity styling in places. Shared components like `TrainingNotesSection`
  may still need alignment.
- **Future:** promote the motif primitives into `packages/ui` once the language
  is proven, so the rest of the app can adopt Trail Telemetry consistently.

---

## 10. Do / Don't

**Do**
- Make the key number the biggest thing on screen.
- Reach for the route/waypoint motif to express progress and state.
- Use display type for headlines and stats; Inter for everything else.
- Keep most content card-free, separated by space and hairlines.

**Don't**
- Add new colors to convey meaning.
- Wrap every widget in a bordered card.
- Write verbose, generic, or apologetic copy.
- Invent one-off decorative shapes when a motif primitive exists.
