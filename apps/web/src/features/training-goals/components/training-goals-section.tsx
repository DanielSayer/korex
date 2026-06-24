import { useQuery } from "@tanstack/react-query";
import { SectionLabel } from "@/components/brand";
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
        <SectionLabel
          action={
            isMobile ? <TrainingGoalCreateForm density={density} /> : null
          }
        >
          Active goals
        </SectionLabel>
        <div className={cn(isMobile ? "mt-3" : "mt-5")}>
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
    <div className="grid gap-4">
      <div className="flex h-20 animate-pulse flex-col gap-2 rounded-lg bg-muted/40" />
      <div className="flex h-20 animate-pulse flex-col gap-2 rounded-lg bg-muted/40" />
    </div>
  );
}

export { TrainingGoalsSection };
