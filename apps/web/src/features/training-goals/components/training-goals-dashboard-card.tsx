import { Button } from "@korex/ui/components/button";
import { Skeleton } from "@korex/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { ErrorMessage } from "@/components/error-message";
import { orpc } from "@/utils/orpc";
import { TrainingGoalList } from "./training-goal-list";

function TrainingGoalsDashboardCard() {
  const progressQuery = useQuery(
    orpc.activities.trainingGoalProgress.queryOptions(),
  );

  return (
    <section className="rounded-xl border border-border/70 bg-card p-3 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-primary text-xs uppercase">
          Training goals
        </h2>
        <Button size="sm" variant="ghost" render={<Link to="/goals" />}>
          Manage
          <ChevronRightIcon className="size-3.5" />
        </Button>
      </div>
      <div className="mt-3">
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
            goals={progressQuery.data.slice(0, 2)}
            variant="compact"
          />
        ) : null}
      </div>
    </section>
  );
}

function TrainingGoalsSkeleton() {
  return (
    <div className="grid gap-2">
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
    </div>
  );
}

export { TrainingGoalsDashboardCard };
