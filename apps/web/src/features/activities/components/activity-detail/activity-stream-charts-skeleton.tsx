function ActivityStreamChartsSkeleton({
  desktop = false,
}: {
  desktop?: boolean;
}) {
  const skeletonChartKeys = ["heart-rate", "cadence", "pace", "elevation"];

  return (
    <section
      className={
        desktop ? "space-y-6 border-border/50 border-y py-8" : "space-y-3"
      }
    >
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div
        className={
          desktop ? "grid xl:grid-cols-2" : "grid gap-4 xl:grid-cols-2"
        }
      >
        {skeletonChartKeys.map((key) => (
          <div
            className={
              desktop
                ? "h-72 animate-pulse border-border/50 border-t bg-muted/20 xl:even:border-l"
                : "h-72 animate-pulse rounded-lg border bg-muted/30"
            }
            key={key}
          />
        ))}
      </div>
    </section>
  );
}

export { ActivityStreamChartsSkeleton };
