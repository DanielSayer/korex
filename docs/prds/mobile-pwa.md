# Mobile PWA PRD

## Problem Statement

Korex has a desktop web app that is good enough to build from, but the authenticated experience is still desktop-shaped on mobile. The current app uses one authenticated sidebar shell and several dense desktop-first pages, such as Calendar and Activity Detail, that rely on desktop real estate or horizontal overflow. A mobile PWA should feel like a deliberate mobile product, not a squeezed version of the desktop app.

The user wants a mobile version with a significantly different interaction model, including bottom tabs, progressive disclosure, and mobile-specific screens where a desktop page contains too much information for one mobile viewport. The work should prepare Korex for installable PWA use while preserving the existing desktop app.

## Solution

Korex will introduce a mobile PWA experience behind the same canonical route tree as desktop. The authenticated app shell will branch by breakpoint: desktop keeps the existing sidebar shell, while mobile receives a bottom-tab shell with safe-area handling and a real `/more` route for lower-frequency destinations.

Mobile work will be delivered progressively, screen by screen, after a small shell foundation. Routes may use separate mobile and desktop page compositions when the workflow materially differs. Shared hooks and utilities should carry data loading, search-param orchestration, date grouping, and formatting logic, while route/page boundaries own mobile/desktop branching as high in the tree as practical.

The first PWA phase focuses on installability, mobile UX, and graceful online-only behavior. It does not attempt true offline reads, offline writes, conflict resolution, or strict one-to-one desktop feature parity.

## User Stories

1. [x] As a mobile Korex user, I want the app to open into a mobile-appropriate shell, so that I can navigate without using a desktop sidebar.
2. [x] As a mobile Korex user, I want primary navigation in bottom tabs, so that common destinations are reachable with one hand.
3. [x] As a mobile Korex user, I want Dashboard, Calendar, Analytics, Goals, and More as primary tabs, so that the app reflects my most common workflows.
4. [x] As a mobile Korex user, I want More to be a real page, so that lower-frequency destinations are discoverable and reloadable.
5. [x] As a mobile Korex user, I want More to include Heatmap, Weekly Summaries, and Settings, so that secondary product areas are not incorrectly grouped under Settings.
6. [x] As a desktop Korex user, I want the current desktop sidebar experience to remain intact, so that the mobile PWA work does not regress the desktop app.
7. [x] As a Korex user opening a shared link, I want the same URL to work on desktop and mobile, so that deep links remain stable.
8. [x] As a mobile Korex user, I want detail screens to use mobile-friendly progressive disclosure, so that dense desktop pages do not become cramped.
9. [x] As a mobile Korex user, I want focused detail and edit flows to hide bottom tabs when appropriate, so that the task has enough vertical space.
10. [x] As a mobile Korex user, I want main tab pages to keep bottom tabs visible, so that I can move between primary workflows predictably.
11. [x] As a mobile Korex user, I want page-specific top chrome, so that each screen can expose the actions that matter for that workflow.
12. [x] As a mobile Korex user, I want Dashboard to show the most important current training information first, so that I can quickly understand my week.
13. [x] As a mobile Korex user, I want Dashboard sync/status actions to remain available, so that I can refresh imported training data.
14. [x] As a mobile Korex user, I want recent Activities to be easy to scan, so that I can jump into recent runs without using a table layout.
15. [x] As a mobile Korex user, I want Dashboard cards to be ordered for a narrow viewport, so that weekly focus, Training Streak, Training Goals, recent Activities, Equipment, and Training Notes make sense in sequence.
16. [x] As a mobile Korex user, I want Calendar to avoid horizontal scrolling, so that I can browse training history naturally on a phone.
17. [x] As a mobile Korex user, I want Calendar to provide month navigation, so that I can move through training periods without desktop controls.
18. [x] As a mobile Korex user, I want Calendar to expose daily Activity lists, so that I can inspect what happened on a specific date.
19. [x] As a mobile Korex user, I want Calendar to expose Training Week summaries, so that weekly context remains available even if the desktop grid is split apart.
20. [x] As a mobile Korex user, I want Calendar day and week destinations to have semantic routes when needed, so that I can deep-link and use browser back behavior.
21. [x] As a mobile Korex user, I want Activity Detail to prioritize the Activity summary, map, key metrics, and Training Notes, so that I can understand a run quickly.
22. [x] As a mobile Korex user, I want Activity Detail to hide bottom tabs when it is a focused drill-in, so that the Activity has enough screen space.
23. [x] As a mobile Korex user, I want Activity Detail charts to be usable on a phone, so that I can inspect streams without fighting desktop chart layouts.
24. [x] As a mobile Korex user, I want Activity Detail to keep Best Efforts, Heart Rate Zone Time, laps, and Equipment available in a sensible order, so that advanced details are not lost.
25. [x] As a mobile Korex user, I want Analytics to present yearly volume and best efforts in mobile-friendly sections, so that I can inspect trends without a desktop layout.
26. [x] As a mobile Korex user, I want Analytics controls to fit a narrow viewport, so that switching year and bucket mode remains easy.
27. [x] As a mobile Korex user, I want Goals to support viewing Training Goal progress, so that I can track current targets from my phone.
28. [x] As a mobile Korex user, I want Goals to support creating and managing Training Goals when feasible, so that mobile is useful beyond read-only monitoring.
29. [x] As a mobile Korex user, I want More to provide clear secondary navigation, so that Heatmap, Weekly Summaries, and Settings are easy to find.
30. [x] As a mobile Korex user, I want Heatmap to remain available from More, so that I can inspect my Activity Route Heatmap on mobile when needed.
31. [x] As a mobile Korex user, I want Heatmap controls to be reachable on small screens, so that display mode selection does not depend on desktop header layout.
32. [x] As a mobile Korex user, I want Weekly Summaries to remain available from More, so that I can replay completed Training Weeks.
33. [x] As a mobile Korex user, I want Weekly Summary detail to be a focused destination when needed, so that summary detail does not compete with list navigation.
34. [x] As a mobile Korex user, I want Settings to be reachable from More, so that account, display, training, notification, and security configuration remains available.
35. [x] As a mobile Korex user, I want Settings sections to use route-level progressive disclosure, so that each section is manageable on a phone.
36. [x] As a mobile Korex user, I want form-heavy settings to use mobile-appropriate controls, so that edits are possible without desktop table layouts.
37. [x] As a mobile Korex user, I want app chrome to respect device safe areas, so that bottom tabs and page content are not obscured by the OS.
38. [x] As a mobile Korex user, I want scroll behavior to feel app-like, so that bottom navigation remains stable while page content scrolls.
39. [x] As a mobile Korex user, I want loading and error states to fit mobile screens, so that unavailable data does not produce broken layouts.
40. [x] As a mobile Korex user, I want offline states to clearly explain that a connection is required, so that online-only behavior is honest.
41. [x] As a mobile Korex user, I want the app to be installable, so that I can launch Korex like a native app.
42. [x] As a mobile Korex user, I want installed-app colors, icons, and launch behavior to feel intentional, so that Korex does not look like a generic generated PWA.
43. [x] As a mobile Korex user, I want service worker updates to be handled gracefully, so that app updates do not leave me in a confusing stale state.
44. [x] As an engineer, I want mobile navigation metadata centralized, so that tab selection, More links, and hidden-bottom-nav routes do not drift across components.
45. [x] As an engineer, I want mobile/desktop branching near route and layout boundaries, so that leaf components do not accumulate ad hoc device conditionals.
46. [x] As an engineer, I want shared hooks for data and search-param orchestration, so that desktop and mobile pages do not duplicate query logic.
47. [x] As an engineer, I want feature-local mobile and desktop compositions, so that each feature owns its mobile workflow without creating a global component junk drawer.
48. [x] As an engineer, I want screen-by-screen delivery, so that the architecture can be validated early and shipped progressively.
49. [x] As an engineer, I want desktop behavior covered while mobile work lands, so that existing desktop workflows do not regress.
50. [x] As an engineer, I want mobile viewport QA built into the work, so that text, navigation, maps, and charts are verified at phone sizes before each story is considered done.

## Implementation Decisions

- Follow ADR 0008: Mobile PWA uses canonical routes with a mobile-specific shell and route-level compositions.
- Use the existing authenticated route tree as the canonical route tree for both desktop and mobile.
- Do not introduce a duplicated `/m` route tree.
- Add semantic child routes only when they represent real user destinations, such as day detail, week detail, Activity Detail, settings sections, Weekly Summary detail, or focused edit/create flows.
- Branch authenticated app chrome by breakpoint: desktop sidebar shell at desktop widths, mobile bottom-tab shell below the chosen mobile breakpoint.
- Use the existing `md` boundary as the initial shell split.
- Keep desktop navigation exposure unchanged for the first phase unless a story explicitly changes it.
- Mobile bottom tabs are Dashboard, Calendar, Analytics, Goals, and More.
- `/more` is a real route and should be reachable directly on all clients.
- `/more` appears in mobile navigation; desktop may render a simple hub if visited directly but does not need sidebar exposure.
- More contains lower-frequency product destinations such as Heatmap, Weekly Summaries, and Settings.
- Settings is not used as a dumping ground for non-settings product areas.
- Mobile top chrome is owned by pages, not the global mobile shell.
- The mobile shell owns bottom tabs, active tab state, safe-area padding, app-height behavior, scroll frame behavior, and bottom-navigation visibility.
- Main mobile tab pages keep bottom navigation visible.
- Focused drill-in pages, such as Activity Detail and future edit/create or full-screen map/chart flows, may hide bottom navigation.
- Centralize mobile navigation metadata for tabs, active tab matching, More links, and bottom-nav hiding rules.
- Prefer route/layout branching over component-level `isMobile` switching.
- Prefer separate mobile and desktop page compositions when workflows materially differ.
- Shared hooks and utilities should hold common data loading, search-param handling, grouping, formatting, and mutation orchestration.
- Feature-local organization is preferred for mobile/desktop compositions, rather than a broad global mobile component area.
- Mobile v1 optimizes workflow parity, not one-to-one desktop feature parity.
- Dashboard, Calendar, Activity Detail, Analytics, Goals, More, Settings, Heatmap, and Weekly Summaries should be handled screen by screen.
- Calendar is expected to need a true mobile composition rather than a horizontally scrolling desktop grid.
- Activity Detail is expected to need mobile-specific ordering and focused drill-in behavior.
- Settings is expected to need route-level section navigation on mobile.
- Goals may start closer to responsive layout if the workflow remains simple.
- PWA install/update polish is a separate later story, not part of the first mobile shell foundation story.
- True offline data support, offline writes, and conflict resolution are deferred from v1.
- The app should show graceful online-only/offline-required states rather than pretending to support offline workflows.
- Do not introduce migrations for this PRD unless a future story separately proves a schema need; none is expected from the current scope.
- Use Bun commands with `bun run` for package scripts.
- Do not run the dev server as part of implementation work; assume the user runs it locally.

## Testing Decisions

- Test behavior at the highest useful seam first: authenticated shell routing/navigation behavior, route-level mobile compositions, and user-visible screen behavior.
- Do not test implementation details such as internal branching flags or exact component decomposition.
- Use unit tests for pure mobile navigation metadata, route matching, bottom-nav visibility decisions, date grouping, formatting, and shared hooks where those can be isolated.
- Use existing Vitest patterns in `apps/tests` for utility and API-adjacent behavior.
- Add route/page tests only where the repo has or gains an appropriate React testing seam; otherwise keep UI verification manual/browser-based until such a seam exists.
- For each screen story, verify the mobile viewport behavior in a browser against the already-running local app rather than starting a second dev server.
- For shell foundation, verify that desktop keeps the sidebar, mobile shows bottom tabs, active tab selection is correct, More is a real route, and focused drill-in routes hide bottom navigation only when intended.
- For Dashboard, verify that sync actions, loading/error states, weekly metrics, recent Activities, Training Goals, Equipment, and Training Notes remain reachable on mobile.
- For Calendar, verify month navigation, Activity discovery, Training Week context, day/week drill-ins where introduced, and no horizontal-scroll dependency on the primary mobile path.
- For Activity Detail, verify map rendering, key metrics, Training Notes, charts/streams, laps, Best Efforts, Heart Rate Zone Time, Equipment, loading, error, and back behavior.
- For Analytics, verify bucket/year controls, chart readability, and best-effort navigation on phone widths.
- For Goals, verify list/progress readability and create/manage flows if included in the story.
- For More, verify secondary destination discovery and back behavior.
- For PWA polish, verify manifest metadata, generated assets, install prompt behavior where available, iOS metadata, theme/background colors, service worker update behavior, and offline-required fallback.
- Visual QA should include narrow mobile, common phone width, and desktop widths to catch shell switching and content overflow.
- Browser checks should include safe-area-adjacent layout review where possible, especially bottom tab spacing and scroll containers.

## Out of Scope

- A duplicated mobile route tree such as `/m/dashboard`.
- Full native-app parity.
- Strict one-to-one feature parity with the desktop app.
- True offline Activity, Calendar, Analytics, Goals, Heatmap, or Settings data.
- Offline writes for Training Notes, Training Goals, Settings, Equipment, or sync workflows.
- Conflict resolution for offline edits.
- Push notifications.
- Background sync.
- App-store packaging.
- Native wrappers.
- Tablet-specific navigation beyond the initial breakpoint-driven shell split.
- User-selectable mobile/desktop mode.
- User-agent or install-state based shell selection.
- Database schema changes or migrations.
- Reworking the desktop app beyond what is needed to preserve shared route/data contracts.
- Replacing the existing PWA plugin stack.
- Starting an additional local dev server during implementation or QA.

## Further Notes

Suggested delivery sequence:

1. Mobile shell foundation: breakpoint shell split, bottom tabs, `/more`, safe-area frame, centralized mobile navigation metadata, and initial hidden-bottom-nav rules.
2. Mobile Dashboard.
3. Mobile Calendar.
4. Mobile Activity Detail.
5. Mobile Analytics.
6. Mobile Goals.
7. Mobile More, Heatmap, Weekly Summaries, and Settings refinement.
8. PWA install/update polish.
9. Final cross-screen mobile QA pass.

The PRD intentionally stays high level. Each screen should get its own story with acceptance criteria before implementation. Those stories should decide the exact mobile composition, any semantic child routes, and which desktop components are reused versus replaced by mobile-specific compositions.
