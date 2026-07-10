import type {
  AnalyticsBestEfforts,
  BestEffortStandardDistanceCode,
} from "@korex/api/modules/activities/activities.types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SectionLabel } from "@/components/brand";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";
import { bestEffortSkeletonKeys } from "./best-efforts/best-effort-distance-options";
import { PersonalBestEffortGrid } from "./best-efforts/personal-best-effort-grid";
import { PersonalBestEffortTrendChart } from "./best-efforts/personal-best-effort-trend-chart";

function AnalyticsBestEffortsSection({
  density = "default",
  year,
}: {
  density?: "default" | "mobile";
  year: number;
}) {
  const bestEffortsQuery = useQuery(
    orpc.activities.analyticsBestEfforts.queryOptions({
      input: { year },
    }),
  );

  return (
    <QueryRenderer
      error={<ErrorMessage message="Could not load best efforts." />}
      loading={<AnalyticsBestEffortsSkeleton />}
      query={bestEffortsQuery}
    >
      {(analytics) => (
        <AnalyticsBestEffortsPanel
          analytics={analytics}
          density={density}
          year={year}
        />
      )}
    </QueryRenderer>
  );
}

function AnalyticsBestEffortsPanel({
  analytics,
  density,
  year,
}: {
  analytics: AnalyticsBestEfforts;
  density: "default" | "mobile";
  year: number;
}) {
  const availableDistanceCodes = analytics.allTime.map(
    (effort) => effort.standardDistanceCode,
  );
  const [selectedDistanceCode, setSelectedDistanceCode] =
    useState<BestEffortStandardDistanceCode>("5k");
  const chartDistanceCode =
    selectedDistanceCode === "5k" && !availableDistanceCodes.includes("5k")
      ? (availableDistanceCodes[0] ?? "5k")
      : selectedDistanceCode;

  const trendChart = (
    <PersonalBestEffortTrendChart
      analytics={analytics}
      availableDistanceCodes={availableDistanceCodes}
      onDistanceCodeChange={setSelectedDistanceCode}
      selectedDistanceCode={chartDistanceCode}
      year={year}
    />
  );

  if (density === "mobile") {
    return (
      <section className="flex min-w-0 flex-col gap-4">
        <SectionLabel>Best efforts</SectionLabel>
        <p className="-mt-1 text-muted-foreground text-xs">
          All-time personal bests and monthly progression.
        </p>
        <PersonalBestEffortGrid efforts={analytics.allTime} />
        {trendChart}
      </section>
    );
  }

  return (
    <section className="min-w-0 pb-3">
      <header className="border-border/60 border-b pb-5">
        <SectionLabel>Personal Best Efforts</SectionLabel>
        <div className="mt-2 flex items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl tracking-tight">
              Marks worth keeping.
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              All-time records beside their month-end progression trail.
            </p>
          </div>
          <p className="hidden text-muted-foreground text-xs xl:block">
            Fastest known contiguous efforts from current Activities
          </p>
        </div>
      </header>
      <div className="mt-7 grid min-w-0 gap-8 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] xl:divide-x xl:divide-border/50">
        <div className="min-w-0">
          <SectionLabel>All-time ledger</SectionLabel>
          <div className="mt-3">
            <PersonalBestEffortGrid efforts={analytics.allTime} />
          </div>
        </div>
        <div className="min-w-0 xl:pl-8">{trendChart}</div>
      </div>
    </section>
  );
}

function AnalyticsBestEffortsSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="h-3 w-24 animate-pulse rounded-sm bg-muted/60" />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {bestEffortSkeletonKeys.map((key) => (
          <div
            className="flex h-16 animate-pulse items-center justify-between border-border/30 border-b py-3"
            key={key}
          >
            <div className="h-3 w-16 animate-pulse rounded-sm bg-muted/40" />
            <div className="h-4 w-20 animate-pulse rounded-sm bg-muted/50" />
          </div>
        ))}
      </div>
      <div className="h-64 w-full animate-pulse rounded-lg bg-muted/30" />
    </div>
  );
}

export { AnalyticsBestEffortsSection };
