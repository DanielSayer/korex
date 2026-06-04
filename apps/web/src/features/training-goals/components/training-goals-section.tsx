import { Skeleton } from "@korex/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ErrorMessage } from "@/components/error-message";
import { orpc } from "@/utils/orpc";
import { TrainingGoalCreateForm } from "./training-goal-create-form";
import { TrainingGoalList } from "./training-goal-list";

function TrainingGoalsSection() {
  const progressQuery = useQuery(
    orpc.activities.trainingGoalProgress.queryOptions(),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border p-5">
        <h2 className="font-semibold text-lg">Active goals</h2>
        <div className="mt-5">
          {progressQuery.isPending ? <TrainingGoalsSkeleton /> : null}
          {progressQuery.isError ? (
            <ErrorMessage
              message="Could not load training goals."
              variant="inline"
            />
          ) : null}
          {progressQuery.isSuccess ? (
            <TrainingGoalList
              empty="No active goals yet."
              goals={progressQuery.data}
            />
          ) : null}
        </div>
      </section>
      <TrainingGoalCreateForm />
    </div>
  );
}

function TrainingGoalsSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-[116px]" />
      <Skeleton className="h-[116px]" />
    </div>
  );
}

export { TrainingGoalsSection };
