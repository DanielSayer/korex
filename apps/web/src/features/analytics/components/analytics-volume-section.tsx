import type {
  AnalyticsVolume,
  AnalyticsVolumeBucketMode,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@korex/ui/components/dropdown-menu";
import { Skeleton } from "@korex/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { formatDistance } from "@/utils/formatters";
import { orpc } from "@/utils/orpc";
import { BucketDistanceChart } from "./bucket-distance-chart";
import { CumulativeDistanceChart } from "./cumulative-distance-chart";

type AnalyticsVolumeSectionProps = {
  bucketMode: AnalyticsVolumeBucketMode;
  year: number;
};

function AnalyticsVolumeSection({
  bucketMode,
  year,
}: AnalyticsVolumeSectionProps) {
  const analyticsQuery = useQuery(
    orpc.activities.analyticsVolume.queryOptions({
      input: { bucketMode, year },
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <QueryRenderer
        error={<ErrorMessage message="Could not load analytics." />}
        loading={<AnalyticsVolumeSkeleton />}
        query={analyticsQuery}
      >
        {(analytics) => <AnalyticsVolumePanel analytics={analytics} />}
      </QueryRenderer>
    </div>
  );
}

function AnalyticsVolumeControls({
  bucketMode,
  onBucketModeChange,
  onYearChange,
  year,
}: {
  bucketMode: AnalyticsVolumeBucketMode;
  onBucketModeChange: (bucketMode: AnalyticsVolumeBucketMode) => void;
  onYearChange: (year: number) => void;
  year: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="inline-grid h-9 grid-cols-2 rounded-md border bg-muted/30 p-0.5">
        {(["monthly", "weekly"] as const).map((mode) => (
          <Button
            className="h-7 min-w-20"
            key={mode}
            onClick={() => onBucketModeChange(mode)}
            size="sm"
            type="button"
            variant={bucketMode === mode ? "secondary" : "ghost"}
          >
            {mode === "monthly" ? "Monthly" : "Weekly"}
          </Button>
        ))}
      </div>
      <YearPicker onYearChange={onYearChange} year={year} />
    </div>
  );
}

function YearPicker({
  onYearChange,
  year,
}: {
  onYearChange: (year: number) => void;
  year: number;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2000 + 1 },
    (_, index) => currentYear - index,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
        <CalendarIcon className="size-4" />
        {year}
        <ChevronDownIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72">
        <DropdownMenuRadioGroup
          onValueChange={(value) => onYearChange(Number(value))}
          value={year.toString()}
        >
          {years.map((option) => (
            <DropdownMenuRadioItem key={option} value={option.toString()}>
              {option}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AnalyticsVolumePanel({ analytics }: { analytics: AnalyticsVolume }) {
  const averageDistanceMeters =
    analytics.buckets.length === 0
      ? 0
      : analytics.totalDistanceMeters / analytics.buckets.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricBlock
          label="Total distance"
          value={formatDistance(analytics.totalDistanceMeters)}
        />
        <MetricBlock
          label={
            analytics.bucketMode === "monthly"
              ? "Average month"
              : "Average week"
          }
          value={formatDistance(averageDistanceMeters)}
        />
        <MetricBlock
          label="Activities"
          value={analytics.totalActivityCount.toString()}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BucketDistanceChart analytics={analytics} />
        <CumulativeDistanceChart analytics={analytics} />
      </div>
    </div>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="mt-1 font-semibold text-2xl tracking-tight">{value}</div>
    </div>
  );
}

function AnalyticsVolumeSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="mt-5 h-80" />
    </div>
  );
}

export { AnalyticsVolumeControls, AnalyticsVolumeSection };
