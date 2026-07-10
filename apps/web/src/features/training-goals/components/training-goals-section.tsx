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
        isMobile
          ? "gap-3"
          : "gap-8 border-border/60 border-y py-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:divide-x lg:divide-border/50",
      )}
    >
      <section className={cn(!isMobile && "min-w-0 lg:pr-8")}>
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
            loading={<TrainingGoalsSkeleton density={density} />}
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
      {isMobile ? null : (
        <div className="min-w-0">
          <TrainingGoalCreateForm density={density} />
        </div>
      )}
    </div>
  );
}

function TrainingGoalsSkeleton({ density }: { density: "default" | "mobile" }) {
  return (
    <div className="grid gap-4">
      <div
        className={cn(
          "flex h-20 animate-pulse flex-col gap-2 bg-muted/40",
          density === "mobile" ? "rounded-lg" : "border-border/50 border-y",
        )}
      />
      <div
        className={cn(
          "flex h-20 animate-pulse flex-col gap-2 bg-muted/40",
          density === "mobile" ? "rounded-lg" : "border-border/50 border-b",
        )}
      />
    </div>
  );
}

export { TrainingGoalsSection };
