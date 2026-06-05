import type { TrainingGoalProgress } from "@korex/api/modules/activities/training-goals/training-goal.types";
import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { cn } from "@korex/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArchiveIcon, SaveIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";
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
        <>
          <p className="mt-2 text-muted-foreground text-sm tabular-nums">
            {formatGoalProgress(goal)}
          </p>
          <TrainingGoalActions goal={goal} />
        </>
      ) : null}
    </div>
  );
}

function TrainingGoalActions({ goal }: { goal: TrainingGoalProgress }) {
  const queryClient = useQueryClient();
  const progressQueryOptions =
    orpc.activities.trainingGoalProgress.queryOptions();
  const [target, setTarget] = useState(() => toDisplayTarget(goal));
  const targetValue = toTargetValue({ goal, target });
  const updateMutation = useMutation(
    orpc.activities.updateTrainingGoal.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: async () => {
        toast.success("Training goal updated");
        await queryClient.invalidateQueries({
          queryKey: progressQueryOptions.queryKey,
        });
      },
    }),
  );
  const archiveMutation = useMutation(
    orpc.activities.archiveTrainingGoal.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: async () => {
        toast.success("Training goal archived");
        await queryClient.invalidateQueries({
          queryKey: progressQueryOptions.queryKey,
        });
      },
    }),
  );

  return (
    <form
      className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();

        if (targetValue === null) {
          toast.error("Enter a target greater than zero.");
          return;
        }

        updateMutation.mutate({
          id: goal.id,
          targetValue,
        });
      }}
    >
      <div className="min-w-0 flex-1">
        <label
          className="mb-1.5 block font-medium text-muted-foreground text-xs"
          htmlFor={`training-goal-${goal.id}-target`}
        >
          Next target {goal.metric === "distance" ? "km" : "runs"}
        </label>
        <Input
          id={`training-goal-${goal.id}-target`}
          inputMode="decimal"
          min="0"
          onChange={(event) => setTarget(event.target.value)}
          step={goal.metric === "distance" ? "0.1" : "1"}
          type="number"
          value={target}
        />
      </div>
      <div className="flex gap-2 self-end">
        <Button
          disabled={targetValue === null}
          loading={updateMutation.isPending}
          loadingText="Saving"
          size="sm"
          type="submit"
        >
          <SaveIcon className="size-4" />
          Save
        </Button>
        <Button
          loading={archiveMutation.isPending}
          loadingText="Archiving"
          onClick={() => archiveMutation.mutate({ id: goal.id })}
          size="sm"
          type="button"
          variant="outline"
        >
          <ArchiveIcon className="size-4" />
          Archive
        </Button>
      </div>
    </form>
  );
}

function toDisplayTarget(goal: TrainingGoalProgress) {
  if (goal.metric === "activityCount") {
    return goal.targetValue.toString();
  }

  return (goal.targetValue / 1000).toString();
}

function toTargetValue({
  goal,
  target,
}: {
  goal: TrainingGoalProgress;
  target: string;
}) {
  const value = Number(target);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return goal.metric === "distance"
    ? Math.round(value * 1000)
    : Math.round(value);
}

export { TrainingGoalList };
