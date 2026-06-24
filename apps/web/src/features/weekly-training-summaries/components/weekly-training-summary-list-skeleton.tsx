const skeletonRows = ["latest-week", "previous-week", "third-week"];

function WeeklyTrainingSummaryListSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {skeletonRows.map((row) => (
        <div
          className="border-border/40 border-b p-3 last:border-b-0 md:rounded-lg md:border md:last:border"
          key={row}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="h-5 w-40 animate-pulse rounded-sm bg-muted/60" />
              <div className="h-3 w-32 animate-pulse rounded-sm bg-muted/40" />
            </div>
            <div className="h-4 w-20 animate-pulse rounded-sm bg-muted/40" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="h-12 animate-pulse rounded-sm bg-muted/30" />
            <div className="h-12 animate-pulse rounded-sm bg-muted/30" />
            <div className="h-12 animate-pulse rounded-sm bg-muted/30" />
          </div>
          <div className="mt-3 h-3 w-48 animate-pulse rounded-sm bg-muted/30" />
        </div>
      ))}
    </div>
  );
}

export { WeeklyTrainingSummaryListSkeleton };
