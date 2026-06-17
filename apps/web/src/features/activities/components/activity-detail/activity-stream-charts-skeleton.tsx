function ActivityStreamChartsSkeleton() {
  const skeletonChartKeys = ["heart-rate", "cadence", "pace", "elevation"];

  return (
    <section className="space-y-3">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 xl:grid-cols-2">
        {skeletonChartKeys.map((key) => (
          <div
            className="h-72 animate-pulse rounded-lg border bg-muted/30"
            key={key}
          />
        ))}
      </div>
    </section>
  );
}

export { ActivityStreamChartsSkeleton };
