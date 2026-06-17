import { Skeleton } from "@korex/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { TrainingGoalCreateForm } from "./training-goal-create-form";
import { TrainingGoalList } from "./training-goal-list";

type TrainingGoalsSectionProps = {
  density?: "default" | "mobile";
};

function TrainingGoalsSection({
  density = "default",
}: TrainingGoalsSectionProps) {
  const progressQuery = useQuery(
    orpc.activities.trainingGoalProgress.queryOptions(),
  );
  const isMobile = density === "mobile";

  return (
    <div
      className={cn(
        "grid",
        isMobile ? "gap-3" : "gap-6 lg:grid-cols-[minmax(0,1fr)_360px]",
      )}
    >
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2
            className={cn(
              "font-semibold",
              isMobile ? "text-primary text-xs uppercase" : "text-lg",
            )}
          >
            Active goals
          </h2>
          {isMobile ? <TrainingGoalCreateForm density={density} /> : null}
        </div>
        <div className={cn(isMobile ? "mt-2" : "mt-5")}>
          <QueryRenderer
            query={progressQuery}
            error={
              <ErrorMessage
                message="Could not load training goals."
                variant="inline"
              />
            }
            loading={<TrainingGoalsSkeleton />}
          >
            {(progress) => (
              <TrainingGoalList
                density={density}
                empty="No active goals yet."
                goals={progress}
                variant="full"
              />
            )}
          </QueryRenderer>
        </div>
      </section>
      {isMobile ? null : <TrainingGoalCreateForm density={density} />}
    </div>
  );
}

function TrainingGoalsSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-29" />
      <Skeleton className="h-29" />
    </div>
  );
}

export { TrainingGoalsSection };
