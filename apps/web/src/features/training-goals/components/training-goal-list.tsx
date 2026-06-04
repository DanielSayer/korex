import type { TrainingGoalProgress } from "@korex/api/modules/activities/training-goals/training-goal.types";
import { cn } from "@korex/ui/lib/utils";
import {
  formatGoalPeriod,
  formatGoalProgress,
  formatGoalTitle,
} from "./training-goal-formatters";

type TrainingGoalListProps = {
  empty: string;
  goals: TrainingGoalProgress[];
  variant?: "compact" | "full";
};

function TrainingGoalList({
  empty,
  goals,
  variant = "full",
}: TrainingGoalListProps) {
  if (goals.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
        {empty}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {goals.map((goal) => (
        <TrainingGoalRow goal={goal} key={goal.id} variant={variant} />
      ))}
    </div>
  );
}

function TrainingGoalRow({
  goal,
  variant,
}: {
  goal: TrainingGoalProgress;
  variant: "compact" | "full";
}) {
  const progress = Math.max(0, Math.min(goal.percentComplete, 100));

  return (
    <div
      className={cn("rounded-md border", variant === "full" ? "p-4" : "p-3")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{formatGoalTitle(goal)}</p>
          <p className="text-muted-foreground text-sm">
            {formatGoalPeriod(goal.period)}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-1 font-medium text-xs",
            goal.achieved
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {goal.achieved ? "Achieved" : `${Math.round(progress)}%`}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>
      {variant === "full" ? (
        <p className="mt-2 text-muted-foreground text-sm tabular-nums">
          {formatGoalProgress(goal)}
        </p>
      ) : null}
    </div>
  );
}

export { TrainingGoalList };
