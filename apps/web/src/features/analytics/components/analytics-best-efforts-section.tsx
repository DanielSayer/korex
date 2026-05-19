import type {
  AnalyticsBestEfforts,
  BestEffortStandardDistanceCode,
} from "@korex/api/modules/activities/activities.types";
import { Skeleton } from "@korex/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-semibold text-xl tracking-tight">Best efforts</h2>
        <p className="text-muted-foreground text-sm">
          All-time personal best efforts and monthly progression.
        </p>
      </div>
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
    <div className="space-y-4">
      <Skeleton className="h-14" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {bestEffortSkeletonKeys.map((key) => (
          <Skeleton className="h-28" key={key} />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export { AnalyticsBestEffortsSection };
