import { Skeleton } from "@korex/ui/components/skeleton";

const skeletonRows = ["latest-week", "previous-week", "third-week"];

function WeeklyTrainingSummaryListSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {skeletonRows.map((row) => (
        <div className="rounded-lg border p-4" key={row}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="mt-4 h-4 w-48" />
        </div>
      ))}
    </div>
  );
}

export { WeeklyTrainingSummaryListSkeleton };
