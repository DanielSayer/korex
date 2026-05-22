import { Skeleton } from "@korex/ui/components/skeleton";

const weekDaySkeletonKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function TrainingStreakSkeleton() {
  return (
    <div className="space-y-4 border-y py-5">
      <Skeleton className="h-5 w-24" />
      <div className="flex items-end gap-5">
        <Skeleton className="h-20 w-14" />
        <div className="grid flex-1 grid-cols-7 gap-2">
          {weekDaySkeletonKeys.map((dayKey) => (
            <div
              className="flex flex-col items-center gap-2"
              key={`training-streak-skeleton-${dayKey}`}
            >
              <Skeleton className="h-4 w-4" />
              <Skeleton className="size-9 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { TrainingStreakSkeleton };
