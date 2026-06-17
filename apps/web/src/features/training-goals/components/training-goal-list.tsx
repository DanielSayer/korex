import type { TrainingGoalProgress } from "@korex/api/modules/activities/training-goals/training-goal.types";
import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@korex/ui/components/sheet";
import { cn } from "@korex/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArchiveIcon, MoreHorizontalIcon, SaveIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";
import {
  formatGoalPeriod,
  formatGoalProgress,
  formatGoalTitle,
} from "./training-goal-formatters";

type TrainingGoalListProps = {
  density?: "default" | "mobile";
  empty: string;
  goals: TrainingGoalProgress[];
  variant?: "compact" | "full";
};

function TrainingGoalList({
  density = "default",
  empty,
  goals,
  variant = "full",
}: TrainingGoalListProps) {
  if (goals.length === 0) {
    return (
      <div
        className={cn(
          "text-muted-foreground text-sm",
          variant === "full" ? "rounded-md border border-dashed p-4" : "py-3",
          density === "mobile" && variant === "full" && "bg-card p-3",
        )}
      >
        {empty}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid",
        variant === "full" ? "gap-3" : "divide-y divide-border/70",
      )}
    >
      {goals.map((goal) => (
        <TrainingGoalRow
          density={density}
          goal={goal}
          key={goal.id}
          variant={variant}
        />
      ))}
    </div>
  );
}

function TrainingGoalRow({
  density,
  goal,
  variant,
}: {
  density: "default" | "mobile";
  goal: TrainingGoalProgress;
  variant: "compact" | "full";
}) {
  const progress = Math.max(0, Math.min(goal.percentComplete, 100));

  return (
    <div
      className={cn(
        variant === "full"
          ? "rounded-md border border-border/70 p-4"
          : "py-3 first:pt-0 last:pb-0",
        density === "mobile" && variant === "full" && "bg-card p-3",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm">{formatGoalTitle(goal)}</p>
          <p className="text-muted-foreground text-xs">
            {formatGoalPeriod(goal.period)}
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {formatGoalProgress(goal)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              "rounded-md px-2 py-1 font-medium text-xs",
              goal.achieved
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {goal.achieved ? "Achieved" : `${Math.round(progress)}%`}
          </span>
          {density === "mobile" && variant === "full" ? (
            <TrainingGoalMobileActions goal={goal} />
          ) : null}
        </div>
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-muted",
          variant === "full" ? "mt-4 h-2" : "mt-3 h-1.5",
        )}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>
      {variant === "full" && density === "default" ? (
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

function TrainingGoalMobileActions({ goal }: { goal: TrainingGoalProgress }) {
  const queryClient = useQueryClient();
  const progressQueryOptions =
    orpc.activities.trainingGoalProgress.queryOptions();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(() => toDisplayTarget(goal));
  const targetValue = toTargetValue({ goal, target });
  const updateMutation = useMutation(
    orpc.activities.updateTrainingGoal.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: async () => {
        toast.success("Training goal updated");
        setOpen(false);
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
        setOpen(false);
        await queryClient.invalidateQueries({
          queryKey: progressQueryOptions.queryKey,
        });
      },
    }),
  );

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        render={
          <Button
            aria-label={`Manage ${formatGoalTitle(goal)}`}
            size="icon-sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <MoreHorizontalIcon className="size-4" />
      </SheetTrigger>
      <SheetContent
        className="max-h-[85svh] overflow-y-auto rounded-t-xl p-0 pb-[env(safe-area-inset-bottom)]"
        side="bottom"
      >
        <SheetHeader className="border-b p-5">
          <SheetTitle>Manage Training Goal</SheetTitle>
          <SheetDescription>
            {formatGoalTitle(goal)} · {formatGoalPeriod(goal.period)}
          </SheetDescription>
        </SheetHeader>
        <form
          className="grid gap-4 p-5"
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
          <div>
            <label
              className="mb-1.5 block font-medium text-muted-foreground text-xs"
              htmlFor={`training-goal-${goal.id}-target-mobile`}
            >
              Next target {goal.metric === "distance" ? "km" : "runs"}
            </label>
            <Input
              id={`training-goal-${goal.id}-target-mobile`}
              inputMode="decimal"
              min="0"
              onChange={(event) => setTarget(event.target.value)}
              step={goal.metric === "distance" ? "0.1" : "1"}
              type="number"
              value={target}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={targetValue === null}
              loading={updateMutation.isPending}
              loadingText="Saving"
              type="submit"
            >
              <SaveIcon className="size-4" />
              Save
            </Button>
            <Button
              loading={archiveMutation.isPending}
              loadingText="Archiving"
              onClick={() => archiveMutation.mutate({ id: goal.id })}
              type="button"
              variant="outline"
            >
              <ArchiveIcon className="size-4" />
              Archive
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
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
