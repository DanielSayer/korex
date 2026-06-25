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

function AnalyticsBestEffortsSection({ year }: { year: number }) {
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
        <AnalyticsBestEffortsPanel analytics={analytics} year={year} />
      )}
    </QueryRenderer>
  );
}

function AnalyticsBestEffortsPanel({
  analytics,
  year,
}: {
  analytics: AnalyticsBestEfforts;
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

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <SectionLabel>Best efforts</SectionLabel>
      <p className="-mt-1 text-muted-foreground text-xs">
        All-time personal bests and monthly progression.
      </p>
      <PersonalBestEffortGrid efforts={analytics.allTime} />
      <PersonalBestEffortTrendChart
        analytics={analytics}
        availableDistanceCodes={availableDistanceCodes}
        onDistanceCodeChange={setSelectedDistanceCode}
        selectedDistanceCode={chartDistanceCode}
        year={year}
      />
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
