import { Skeleton } from "@korex/ui/components/skeleton";

function ActivityDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-5 w-56" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}

export { ActivityDetailSkeleton };
