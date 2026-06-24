import { Button } from "@korex/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { SectionLabel } from "@/components/brand";
import { ErrorMessage } from "@/components/error-message";
import { orpc } from "@/utils/orpc";
import { TrainingGoalList } from "./training-goal-list";

function TrainingGoalsDashboardCard() {
  const progressQuery = useQuery(
    orpc.activities.trainingGoalProgress.queryOptions(),
  );

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel
        action={
          <Button
            nativeButton={false}
            size="sm"
            variant="ghost"
            render={<Link to="/goals" />}
          >
            Manage
            <ChevronRightIcon className="size-3.5" />
          </Button>
        }
      >
        Goals
      </SectionLabel>
      <div>
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
            goals={progressQuery.data.slice(0, 1)}
            variant="compact"
          />
        ) : null}
      </div>
    </div>
  );
}

function TrainingGoalsSkeleton() {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <div className="h-4 w-2/3 animate-pulse rounded-sm bg-muted/60" />
        <div className="h-4 w-16 animate-pulse rounded-sm bg-muted/40" />
      </div>
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded-sm bg-muted/40" />
      <div className="mt-3 h-1 w-full animate-pulse rounded-full bg-muted/50" />
    </div>
  );
}

export { TrainingGoalsDashboardCard };
