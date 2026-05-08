import { Skeleton } from "@korex/ui/components/skeleton";

const skeletonCards = [
  "latest-run",
  "second-latest-run",
  "third-latest-run",
  "fourth-latest-run",
  "fifth-latest-run",
];

function LastFiveRunsSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {skeletonCards.map((card) => (
        <div className="space-y-3" key={`filmstrip-skeleton-${card}`}>
          <Skeleton className="h-28" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

export { LastFiveRunsSkeleton };
