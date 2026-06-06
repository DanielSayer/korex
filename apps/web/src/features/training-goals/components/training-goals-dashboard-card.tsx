import { Button } from "@korex/ui/components/button";
import { Skeleton } from "@korex/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { TargetIcon } from "lucide-react";
import { ErrorMessage } from "@/components/error-message";
import { orpc } from "@/utils/orpc";
import { TrainingGoalList } from "./training-goal-list";

function TrainingGoalsDashboardCard() {
  const progressQuery = useQuery(
    orpc.activities.trainingGoalProgress.queryOptions(),
  );

  return (
    <section className="rounded-xl border border-border/55 bg-card/40 p-5 shadow-black/5 shadow-md backdrop-blur-sm dark:bg-card/35 dark:shadow-black/15">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TargetIcon className="hidden size-5 text-muted-foreground" />
          <h2 className="font-semibold font-serif text-sm uppercase">
            Training goals
          </h2>
        </div>
        <Button size="sm" variant="outline" render={<Link to="/goals" />}>
          Manage
        </Button>
      </div>
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
    <div className="grid gap-3">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  );
}

export { TrainingGoalsDashboardCard };
