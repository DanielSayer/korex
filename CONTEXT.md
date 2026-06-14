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

**Activity Stream Replacement**:
The transactional replacement of an **Activity's** full **Activity Stream** set, including invalidation of derived **Activity** data made stale by the new streams.
_Avoid_: Stream update, stream save, zone-time stream replacement

**Activity Heart Rate Zone Time**:
A point-in-time duration summary for an **Activity** calculated from heart-rate data using a snapshot of the user's **Heart Rate Zones** at calculation time.
_Avoid_: Provider zone time, live zone time

**Activity Heart Rate Zone Snapshot**:
The historical **Heart Rate Zone** name, position, and beats-per-minute bounds captured for an **Activity** before zone-time calculation.
_Avoid_: Pending zone time, copied zone

**Activity Map Coordinate**:
A latitude and longitude pair in an **Activity Map**.
_Avoid_: Latlng, point, GPS row

**Activity Route Heatmap**:
A user-owned visualization derived from run **Activity Maps**, showing route density across selected **Activities**.
_Avoid_: Heat map, all-activity heatmap, route overlay

**Activity Route Heatmap Contribution**:
A materialized spatial bucket showing that one run **Activity** passed through one area for **Activity Route Heatmap** display.
_Avoid_: Activity route, heatmap map, raw heatmap point

**Activity Route Heatmap Display Mode**:
A presentation choice for an **Activity Route Heatmap**, initially either density display or visited display.
_Avoid_: Binary heatmap, separate heatmap

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

**Training Note**:
A user-owned plain-text observation about training, optionally attached to an **Activity** or **Training Week**.
_Avoid_: Journal entry, comment, annotation

**Training Note Tag**:
A user-owned colored label used to classify **Training Notes**.
_Avoid_: Category, label, hashtag

**Training Streak**:
A count of consecutive **Training Weeks** in which a **User** has at least one qualifying **Activity**.
_Avoid_: Activity streak, weekly streak

**Training Goal**:
A user-owned training target with a metric, target value, and evaluation period, measured from current **Activities**.
_Avoid_: Provider goal, activity goal, weekly summary goal

**Training Goal Metric**:
The kind of training progress a **Training Goal** targets, initially either distance or activity count.
_Avoid_: Goal type, target type, measurement

**Training Goal Period**:
The time span over which a **Training Goal** is evaluated, initially either a **Training Week** or a calendar month.
_Avoid_: Goal window, goal range, reporting period

**Training Goal Sport Scope**:
The named training discipline whose **Activities** can contribute to a **Training Goal**, initially **Running**.
_Avoid_: Goal activity type, goal sport type, activity filter

**Running Training Goal Sport Scope**:
A **Training Goal Sport Scope** that includes run and treadmill **Activities**.
_Avoid_: Run/treadmill goal, cardio goal, running activity filter

**Recurring Training Goal**:
A **Training Goal** that applies to each new matching **Training Goal Period** until the user changes or archives it.
_Avoid_: Goal template, repeated goal, standing target

**Training Goal Version**:
The effective target value for a **Recurring Training Goal** during a specific span of time.
_Avoid_: Goal revision, goal history row, previous goal

**Training Goal Target Value**:
The canonical numeric threshold a **Training Goal** must reach to be achieved.
_Avoid_: Display target, goal amount, goal value

**Qualifying Activity**:
An **Activity** that can extend a **Training Streak**, initially limited to run and treadmill **Activities**.
_Avoid_: Streak activity, counted workout

**Analytics Volume**:
A live distance or duration aggregate calculated from current **Activities** for a selected time bucket.
_Avoid_: Weekly summary volume, snapshot volume

**Dashboard Weekly Distance**:
A live dashboard read model showing recent weekly distance from current **Activities**, with the newest point representing the current in-progress **Training Week**.
_Avoid_: Dashboard mileage, snapshot graph, weekly summary graph

**Dashboard This Week**:
A live dashboard read model summarizing the current in-progress **Training Week** from current run and treadmill **Activities**.
_Avoid_: Current weekly summary, this week snapshot, top card mock data

**Personal Best Effort**:
The fastest known contiguous distance effort by a **User** over a standard distance, derived from current **Activities**.
_Avoid_: PR, record, best split

**Activity Best Effort**:
The fastest known contiguous distance effort within one **Activity** over a standard distance.
_Avoid_: Activity PR, lap best, best split

**Equipment**:
A user-owned physical item used during **Activities** and tracked for usage over time.
_Avoid_: Gear, shoe, provider gear

**Equipment Type**:
A Korex-owned classification for **Equipment**, initially shoes.
_Avoid_: Gear type, equipment category

**Activity Equipment Use**:
A user-owned association showing that one **Equipment** item was used during one **Activity**.
_Avoid_: Gear assignment, activity gear, equipment link

**Default Equipment**:
The **Equipment** item Korex automatically uses for newly imported matching **Activities**.
_Avoid_: Auto gear, favorite shoe, default assignment

**Equipment Starting Distance**:
The user-entered distance already accumulated by an **Equipment** item before Korex-tracked **Activity Equipment Uses**.
_Avoid_: Existing miles, initial mileage, manual distance

**Retired Equipment**:
**Equipment** the **User** no longer actively uses but keeps for historical **Activity** usage.
_Avoid_: Deleted gear, inactive shoe, archived equipment

**Equipment Retirement Distance**:
The optional usage distance at which a **User** intends to stop actively using an **Equipment** item.
_Avoid_: Shoe lifespan, mileage limit, max miles

## Relationships

- A **Heart Rate Zone** belongs to exactly one **User**
- A **Provider Profile** can seed one or more **Heart Rate Zones**
- A **Heart Rate Zone** remains user-owned after it is seeded from a **Provider Profile**
- A **Provider Profile** is only a source of defaults for **Heart Rate Zones**, not ongoing provenance.
- **Heart Rate Zones** for the same **User** must not overlap; gaps are allowed.
- A **User** has one active set of **Heart Rate Zones**.
- An **Anti-Corruption Layer** translates **Provider Profile** heart-rate zone data into **Heart Rate Zones**.
- An **Activity** belongs to exactly one **User**.
- An **Activity** can have zero or more **Activity Equipment Uses**.
- An **Activity** can use more than one **Equipment** item.
- An **Activity** can have at most one **Activity Equipment Use** for a given **Equipment Type** in the initial model.
- An **Activity** can have zero or more **Training Notes**.
- An **Activity** has exactly one **Sport Type**.
- An **Activity** can have zero or more **Activity Laps**.
- An **Activity** can have zero or one **Activity Map**.
- An **Activity** can have zero or more **Activity Streams**.
- An **Equipment** item belongs to exactly one **User**.
- An **Equipment** item has exactly one **Equipment Type**.
- An **Equipment** item can have zero or more **Activity Equipment Uses**.
- Initial **Equipment Types** are limited to shoes.
- An **Activity Equipment Use** belongs to exactly one **Activity** and exactly one **Equipment** item.
- A **User** can have at most one active **Default Equipment** per **Equipment Type** and **Sport Type**.
- **Default Equipment** creates **Activity Equipment Uses** for newly imported matching **Activities**.
- **Default Equipment** assignment is core-owned import behavior, not provider **Anti-Corruption Layer** behavior.
- **Default Equipment** assignment only creates an **Activity Equipment Use** when the **Activity** has no existing use for that **Equipment Type**.
- Changing **Default Equipment** does not rewrite existing **Activity Equipment Uses**.
- Existing **Activities** can receive **Activity Equipment Uses** through an explicit user action filtered by date range, **Sport Type**, and whether they already have matching **Equipment**.
- **Equipment** usage distance is the sum of its **Equipment Starting Distance** and current **Activity** distances from **Activity Equipment Uses** for that **Equipment** item.
- **Equipment Starting Distance** is user-entered and does not create **Activity Equipment Uses**.
- **Equipment Starting Distance** is stored in meters.
- Changing an **Activity's** distance changes current **Equipment** usage distance.
- **Activity Equipment Uses** do not preserve historical **Activity** distance snapshots in the initial model.
- **Retired Equipment** remains visible in historical **Activity Equipment Uses**.
- **Retired Equipment** cannot be selected as **Default Equipment**.
- **Retired Equipment** is not automatically assigned to future **Activities**.
- **Equipment Retirement Distance** is stored in meters.
- **Equipment Retirement Distance** does not automatically retire **Equipment**.
- An **Activity Lap** belongs to exactly one **Activity**.
- An **Activity Map** belongs to exactly one **Activity**.
- An **Activity Stream** belongs to exactly one **Activity**.
- Each **Activity** can have only one **Activity Stream** for a given stream type.
- **Activity Streams** are initially limited to cadence, distance, altitude, heart rate, velocity, and elapsed time.
- Intervals.icu cadence stream values are revolutions per minute and become steps per minute in Korex by doubling each value.
- Intervals.icu `time` stream values become elapsed-time **Activity Stream** values in Korex.
- **Activity Stream Replacement** replaces the full **Activity Stream** set for one **Activity**.
- **Activity Stream Replacement** makes derived **Activity** data stale, including **Activity Heart Rate Zone Times** and **Activity Best Efforts**.
- **Activity Stream Replacement** captures fresh **Activity Heart Rate Zone Snapshots** when the replacement includes a heart-rate **Activity Stream** and the **User** has active **Heart Rate Zones**.
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
- An **Activity Route Heatmap** is derived from run **Activity Maps** only.
- **Activity Route Heatmap** density counts how many distinct **Activities** pass through an area, not how many **Activity Map Coordinates** were recorded there.
- **Activity Route Heatmap** data is materialized separately from **Activity Maps** so map display data and heatmap query data can scale independently.
- An **Activity Route Heatmap** supports global discovery: a user can pan to any visible region and see materialized run density where that user has run.
- An **Activity Route Heatmap** can be shown with an **Activity Route Heatmap Display Mode** without changing the underlying materialized data.
- An **Activity Route Heatmap** initially materializes slippy-map zoom levels 4 through 15 inclusive.
- The initial **Activity Route Heatmap** displays all-time run density; date range filtering is deferred.
- The initial **Activity Route Heatmap** read model returns grouped cells for a requested viewport, not raw contribution rows.
- The initial **Activity Route Heatmap** is private to the authenticated **User** whose run **Activities** produced it.
- An **Activity Route Heatmap Contribution** belongs to exactly one run **Activity**.
- An **Activity Route Heatmap Contribution** identifies one cell in a fixed 64 by 64 grid inside a slippy-map tile at one materialized zoom level.
- An **Activity Route Heatmap Contribution** preserves the parent **Activity** start time so future heatmap date range filtering can avoid joining every contribution back to its **Activity**.
- Replacing an **Activity Map** for a run **Activity** replaces that **Activity's** **Activity Route Heatmap Contributions** as a set.
- **Activity Route Heatmap Contributions** are calculated by a separate durable job after **Activity Map** replacement, not inside provider sync request or import transaction lifetimes.
- **Activity Route Heatmap Contributions** are calculated from consecutive **Activity Map Coordinate** segments, not from isolated coordinate samples.
- **Activity Route Heatmap** calculation may simplify route geometry per materialized zoom, but simplification must not change the canonical **Activity Map**.
- Existing run **Activity Maps** can be backfilled into **Activity Route Heatmap Contributions** by enqueueing durable calculation jobs; backfill does not calculate contributions inline.
- **Activity Maps** remain the canonical data for single-Activity route display; **Activity Route Heatmap Contributions** are derived query data for heatmap display.
- If a run **Activity Map** is preserved after malformed or missing provider map data, its **Activity Route Heatmap Contributions** remain unchanged.
- If an **Activity** no longer qualifies for the **Activity Route Heatmap**, Korex removes that **Activity's** **Activity Route Heatmap Contributions**.
- Treadmill **Activities** and hike **Activities** do not contribute to the initial **Activity Route Heatmap**.
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
- Upstream activity identifiers in **Provider Activity Metadata** exist for import convenience and backfilling only; app-facing Activity usage must identify the core **Activity**.
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
- A **Training Week** can have zero or more **Training Notes**.
- A **Training Note** can be attached to a **Training Week** even when no **Weekly Training Summary** exists for that **Training Week**.
- A **Training Note** can be attached to a **Training Week** even when that **Training Week** has no **Activities**.
- A **Training Note** cannot be attached to a future **Training Week**.
- **Training Notes** attached to a **Training Week** remain attached to that **Training Week** when a **Weekly Training Summary** for the same week is regenerated.
- **Training Notes** attached to a **Training Week** use that **Training Week's** Monday-start date.
- **Training Notes** can be displayed alongside a **Weekly Training Summary**, but they are not inputs to **Weekly Training Summary** generation.
- **Training Notes** attached to **Activities** in a **Training Week** can be displayed in that **Training Week** context without becoming **Training Week** notes.
- A **Training Note** belongs to exactly one **User**.
- A **Training Note** can have zero or more **Training Note Tags**.
- A **Training Note** can be saved without **Training Note Tags**.
- A **Training Note** contains plain text only.
- A **Training Note** does not have a user-authored title.
- A **Training Note** must have plain text, one or more **Training Note Tags**, or both.
- A **Training Note** must be attached to exactly one target: either one **Activity** or one **Training Week**.
- A **Training Note** can be attached to any **Activity** owned by the **User**, regardless of **Sport Type**.
- A **Training Note** must not be attached to both an **Activity** and a **Training Week**.
- A **Training Note's** attachment target cannot be changed after creation.
- A **Training Note** can be deleted by its owning **User**.
- A **Training Note** can be edited by its owning **User** without preserving prior note text.
- A **Training Note's** tag assignments can be changed by its owning **User**.
- Changing a **Training Note's** tag assignments updates the **Training Note** updated timestamp.
- A **Training Note** attached to an **Activity** is deleted when that **Activity** is deleted.
- **Training Notes** are core-owned user data and must not be created, changed, or deleted by provider sync.
- **Training Notes** do not update **Activity** metrics, **Training Week** metrics, derived **Activity** data, or durable calculation jobs.
- A **Training Note Tag** belongs to exactly one **User**.
- A **Training Note Tag** classifies **Training Notes** only.
- A **Training Note Tag** can classify zero or more **Training Notes**.
- A **Training Note Tag** name must be short, non-empty text intended for display as a compact label.
- Active **Training Note Tags** are displayed alphabetically by name.
- **Training Notes** can be filtered by **Training Note Tags** within their current **Activity** or **Training Week** context.
- When multiple **Training Note Tags** are selected as filters, a **Training Note** appears if it has any selected tag.
- Archived **Training Note Tags** can appear as filter options only when visible **Training Notes** in the current context already use them.
- **Training Note Tag** filtering does not create a global **Training Notes** page.
- **Training Note Tags** do not update **Activity** metrics, **Training Week** metrics, generated summaries, or durable calculation jobs.
- A **User** cannot have two **Training Note Tags** with the same name ignoring case.
- Archived **Training Note Tags** still count when enforcing name uniqueness for a **User**.
- A **Training Note Tag** preserves the display casing chosen by the **User**.
- A **Training Note Tag** name can be changed by its owning **User**.
- Changing a **Training Note Tag's** name changes how that tag appears on all **Training Notes** using it.
- A **Training Note Tag** has a user-managed display color.
- Changing a **Training Note Tag's** display color changes how that tag appears on all **Training Notes** using it.
- A **Training Note Tag** can be archived by its owning **User**.
- An archived **Training Note Tag** can be restored by its owning **User**.
- Archived **Training Note Tags** are hidden from active tag assignment lists.
- An archived **Training Note Tag** remains visible on **Training Notes** that already use it.
- An archived **Training Note Tag** cannot be assigned to new **Training Notes**.
- An archived **Training Note Tag** can be removed from a **Training Note** that already uses it.
- An archived **Training Note Tag** cannot be re-assigned after it is removed from a **Training Note**.
- **Training Weeks** currently use the Australia/Brisbane timezone until Korex supports a user-defined timezone setting.
- A **Training Streak** belongs to exactly one **User**.
- A completed **Training Week** increases a **Training Streak** when it contains at least one **Qualifying Activity**.
- A completed **Training Week** with zero **Qualifying Activities** resets a **Training Streak**.
- The current in-progress **Training Week** can visibly extend a **Training Streak** once the user has at least one **Qualifying Activity**, but it does not cause the streak to drop before the **Training Week** completes.
- A **Training Streak** maximum can increase during the current in-progress **Training Week** once that week has a **Qualifying Activity**.
- **Training Streak** boundaries align with **Weekly Training Summary** boundaries.
- **Training Streak** updates are handled by durable background work, not by provider sync request lifetimes or UI render paths.
- A **Training Goal** belongs to exactly one **User**.
- A **Training Goal** has exactly one **Training Goal Metric**.
- A **Training Goal** has exactly one **Training Goal Period**.
- A **Training Goal** has a **Training Goal Sport Scope**.
- A **Training Goal** does not have a custom user-facing name in the initial model.
- A **Training Goal** is measured from current **Activities**, not from **Weekly Training Summaries**.
- Initial **Training Goals** are **Recurring Training Goals**.
- A **Recurring Training Goal** applies to each new matching **Training Goal Period** until the user changes or archives it.
- A **User** can have at most one active **Recurring Training Goal** for the same **Training Goal Metric**, **Training Goal Period**, and **Training Goal Sport Scope**.
- A **Recurring Training Goal** has one or more **Training Goal Versions**.
- A **Training Goal Version** preserves the **Training Goal Target Value** that applies during its effective time span.
- Changing a **Recurring Training Goal** creates a new **Training Goal Version** rather than rewriting historical target values.
- Changing a **Recurring Training Goal** only changes its **Training Goal Target Value**; changing metric, period, or sport scope requires archiving the goal and creating a new one.
- Repeated changes before the next matching **Training Goal Period** replace the pending future **Training Goal Version** rather than preserving unapplied target values.
- Historical **Training Goal Periods** are evaluated against the **Training Goal Version** that applied during that period.
- A newly created **Recurring Training Goal** applies to the current in-progress **Training Goal Period** when there is no existing active goal for the same **Training Goal Metric**, **Training Goal Period**, and **Training Goal Sport Scope**.
- A newly created initial **Recurring Training Goal** uses the **Running Training Goal Sport Scope**.
- A newly created **Recurring Training Goal** cannot be backdated or scheduled for a future **Training Goal Period** in the initial model.
- Creating a **Recurring Training Goal** records the goal definition and does not calculate live progress.
- Creating a **Recurring Training Goal** fails when the **User** already has an active **Recurring Training Goal** for the same **Training Goal Metric**, **Training Goal Period**, and **Training Goal Sport Scope**.
- A changed **Recurring Training Goal** applies from the next matching **Training Goal Period**, not the current in-progress period.
- Archiving a **Recurring Training Goal** removes it from the current in-progress and future **Training Goal Periods**.
- Archiving a **Recurring Training Goal** preserves completed historical **Training Goal Period** evaluations.
- Archiving a **Recurring Training Goal** discards pending future **Training Goal Versions** that have not applied to a **Training Goal Period**.
- Archiving a **Recurring Training Goal** is irreversible in the initial model.
- An archived **Recurring Training Goal** cannot be changed.
- **Training Goal** progress and achievement are live evaluations from current **Activities**, not finalized snapshots.
- A **Training Goal** is achieved when its measured progress is greater than or equal to its target value.
- Initial **Training Goal Metrics** are distance and activity count.
- Initial **Training Goal Periods** are **Training Week** and calendar month.
- The initial **Training Goal Sport Scope** is **Running Training Goal Sport Scope**.
- A **Running Training Goal Sport Scope** includes run and treadmill **Activities**.
- A distance **Training Goal Target Value** is stored in meters.
- An activity-count **Training Goal Target Value** is stored as a whole number count.
- A **Training Goal Target Value** must be greater than zero.
- A distance **Training Goal** measures total distance from current **Activities** inside its **Training Goal Sport Scope**.
- An activity-count **Training Goal** counts current **Activities** inside its **Training Goal Sport Scope**.
- An activity-count **Training Goal** does not require matching **Activities** to meet a minimum distance or duration.
- **Analytics Volume** is calculated from current **Activities**, not from **Weekly Training Summaries**.
- **Analytics Volume** may be grouped by **Training Week** or by calendar month for chart display.
- The first **Analytics Volume** chart uses distance as its default volume metric.
- The initial analytics page scopes live chart aggregates to a selected calendar year, defaulting to the current calendar year.
- Weekly **Analytics Volume** buckets align with full **Training Weeks** whose start date falls inside the selected calendar year so they stay in sync with weekly review displays.
- Analytics cumulative distance accumulates the visible chart buckets, so monthly and weekly views may have different boundary totals for the same selected year.
- The initial **Analytics Volume** chart includes run and treadmill **Activities**; finer sport filters such as all, run-only, or treadmill-only can be added later.
- **Weekly Training Summaries** remain replayable snapshot artifacts and must not be treated as the source of truth for live analytics charts.
- **Dashboard Weekly Distance** is calculated from current run and treadmill **Activities**, not from **Weekly Training Summaries**.
- **Dashboard Weekly Distance** includes the current in-progress **Training Week** as the newest chart point.
- **Dashboard Weekly Distance** average weekly distance is calculated across the visible chart buckets, including the current in-progress **Training Week**.
- **Dashboard Weekly Distance** compares the current in-progress **Training Week** to the previous **Training Week** at the same elapsed wall-clock point in the week.
- **Dashboard This Week** is calculated from current run and treadmill **Activities**, not from **Weekly Training Summaries**.
- **Dashboard This Week** covers the current in-progress **Training Week** only.
- **Dashboard This Week** can include **Dashboard Weekly Distance** when a dashboard screen needs both top-card metrics and the weekly-distance chart.
- A **Personal Best Effort** belongs to exactly one **User**.
- A **Personal Best Effort** is derived from one **Activity Best Effort**.
- A **Personal Best Effort** covers one standard distance.
- A **Personal Best Effort** duration uses elapsed time between the interpolated start and end distance boundaries, so pauses inside the effort window count.
- An **Activity Best Effort** belongs to exactly one **Activity**.
- An **Activity Best Effort** covers one standard distance.
- A **Personal Best Effort** is the fastest known **Activity Best Effort** for a **User** and standard distance.
- **Activity Best Efforts** are calculated by separate durable jobs after qualifying **Activity Stream** replacement, not inside provider sync request or import transaction lifetimes.
- One activity-scoped durable job replaces an **Activity's** **Activity Best Efforts** and refreshes the affected **Personal Best Efforts**.
- When **Personal Best Efforts** tie on duration, the earliest achieved effort wins; remaining ties are resolved deterministically.
- The initial standard distances for **Activity Best Efforts** and **Personal Best Efforts** are 400 meters, 800 meters, 1000 meters, 1 mile, 3000 meters, 5K, 10K, half marathon, and marathon.
- **Activity Best Efforts** and **Personal Best Efforts** are identified by standard-distance code, not raw distance meters.
- A monthly **Personal Best Effort** trend shows the fastest **Activity Best Effort** achieved on or before each calendar month end, not the fastest effort performed inside that month only.
- **Activity Best Efforts** require run or treadmill **Activities** with paired distance and elapsed-time **Activity Streams** of the same length.
- **Activity Best Efforts** are not calculated from **Activity Streams** with non-finite values, decreasing elapsed time, or decreasing distance.
- If an **Activity** cannot produce reliable **Activity Best Efforts**, Korex stores no **Activity Best Efforts** for that **Activity**.
- Replacing distance or elapsed-time **Activity Streams** makes an **Activity's** **Activity Best Efforts** stale.
- Changing or deleting an **Activity** can make both **Activity Best Efforts** and **Personal Best Efforts** stale.
- Existing eligible **Activities** can be backfilled into **Activity Best Efforts** by enqueueing durable calculation jobs.
- The initial Activity detail summary exposes concepts already present in the Korex domain language; old application fields without a resolved Korex domain concept are deferred.
- The initial Activity detail summary is shaped around domain boundaries: an **Activity** with nested **Activity Map**, **Activity Laps**, **Activity Heart Rate Zone Snapshots**, **Activity Heart Rate Zone Times**, and **Activity Best Efforts**.

## Architecture Boundaries

- Korex uses Effect at application and workflow boundaries, where orchestration composes repositories, provider clients, clocks, encryption, transactions, and durable jobs.
- Repositories stay Promise-based and data-shaped. They expose literal persistence operations such as insert, update, query, claim, mark, replace, enqueue, and delete.
- Repositories must not decide downstream workflow behavior such as which derived jobs to enqueue, which snapshots to capture, or which projections to refresh.
- Pure calculation modules stay plain TypeScript unless they need external dependencies. Effect wraps the workflow that calls them, not the calculation itself.
- Workflow modules use `*.dependencies.ts` for `Context.Tag` service contracts, `*.service.ts` for Effect-returning functions, and `*.live.ts` for live layer composition.

## Example dialogue

> **Dev:** "When Intervals.icu returns heart-rate zones during profile sync, do those remain Intervals settings?"
> **Domain expert:** "No. They become Korex **Heart Rate Zones** for that **User**, and the user can edit them later."

## Flagged ambiguities

- "heart rate bucket" was used for the same concept as **Heart Rate Zone**; resolved: use **Heart Rate Zone** in domain language.
- "Intervals" can mean the upstream provider **Intervals.icu** or interval running training; resolved: use **Intervals.icu** for the provider and avoid bare "intervals" in domain language.
- "activity" can mean either the provider record or the Korex-owned workout; resolved: use **Activity** for the Korex domain object and **Provider Activity Metadata** only for upstream provenance.
- "activity id" can mean an upstream provider identifier or the Korex-owned **Activity** id; resolved: app-facing Activity usage means the core **Activity** id, while upstream ids stay inside **Provider Activity Metadata** for import and backfill work.
- The old application Activity detail contract included fields that do not yet exist in Korex domain language; resolved: omit those fields from the initial Activity detail summary rather than carrying old contract vocabulary forward.
- "summary" can mean a page-shaped flat object or a domain-shaped read model; resolved: the initial Activity detail summary uses nested domain concepts rather than flattening child concepts into the **Activity**.
- "lap" and "split" can refer to provider-shaped segment records; resolved: use **Activity Lap** for the Korex-owned segment of an **Activity**.
- "zone time" can mean provider-reported durations or Korex-calculated activity summaries; resolved: use **Activity Heart Rate Zone Time** only for point-in-time durations calculated by Korex.
- "pending zone time" was considered for captured zones awaiting calculation; resolved: use **Activity Heart Rate Zone Snapshot** for the captured historical zone definition and **Activity Heart Rate Zone Time** only for calculated durations.
- "last sync time" can mean when a sync started, finished, or last wrote provider connection metadata; resolved: use **Incremental Activity Sync Watermark** for the lower bound of an incremental activity sync window.
- "volume" can mean either a live analytics aggregate or a replayed weekly snapshot; resolved: use **Analytics Volume** for live chart aggregates calculated from current **Activities**.
- "best effort" can mean a provider badge, race record, or lap split; resolved: use **Personal Best Effort** for the fastest known contiguous standard-distance effort derived inside Korex.
- "goal" can mean a provider-owned target, an activity-specific target, or a replayed weekly artifact; resolved: use **Training Goal** for a user-owned target measured from current **Activities**.
