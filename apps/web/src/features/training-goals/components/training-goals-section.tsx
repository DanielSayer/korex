import { Skeleton } from "@korex/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";
import { TrainingGoalCreateForm } from "./training-goal-create-form";
import { TrainingGoalList } from "./training-goal-list";

function TrainingGoalsSection() {
  const progressQuery = useQuery(
    orpc.activities.trainingGoalProgress.queryOptions(),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <h2 className="font-semibold text-lg">Active goals</h2>
        <div className="mt-5">
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
                empty="No active goals yet."
                goals={progress}
                variant="full"
              />
            )}
          </QueryRenderer>
        </div>
      </section>
      <TrainingGoalCreateForm />
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
