import { Skeleton } from "@korex/ui/components/skeleton";

function WeeklyDistanceSkeleton() {
  return (
    <section className="py-1">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
        <div className="grid gap-4 lg:w-52 lg:shrink-0">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
          </div>
        </div>
        <Skeleton className="h-44 min-w-0 flex-1" />
      </div>
    </section>
  );
}

export { WeeklyDistanceSkeleton };
