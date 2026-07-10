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
import {
  ArchiveIcon,
  CheckIcon,
  MoreHorizontalIcon,
  SaveIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RouteProgress } from "@/components/brand";
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
          variant === "full" && density === "mobile"
            ? "rounded-md border border-dashed p-4"
            : "py-3",
          variant === "full" && density === "default"
            ? "border-border/50 border-y py-8"
            : null,
          density === "mobile" && variant === "full" && "bg-card p-3",
        )}
      >
        <p>{empty}</p>
        {variant === "full" && density === "default" ? (
          <p className="mt-1 text-xs">Set the first marker for the trail.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid",
        variant === "full" ? "gap-3" : "divide-y divide-border/70",
        variant === "full" && density === "default" && "gap-0",
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

  if (variant === "compact") {
    return (
      <div className="py-3 first:pt-0 last:pb-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="line-clamp-1 font-medium text-sm">
            {formatGoalTitle(goal)}
          </p>
          <span className="flex shrink-0 items-center gap-1 font-display text-sm tabular-nums">
            {goal.achieved ? (
              <CheckIcon className="size-3.5 text-primary" />
            ) : null}
            {formatGoalProgress(goal)}
          </span>
        </div>
        <p className="text-muted-foreground text-xs">
          {formatGoalPeriod(goal.period)}
        </p>
        <RouteProgress className="mt-3" value={progress} />
      </div>
    );
  }

  if (variant === "full" && density === "mobile") {
    return (
      <div className="border-border/40 border-b py-4 first:pt-0 last:border-b-0 last:pb-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="line-clamp-1 font-display text-base tracking-tight">
            {formatGoalTitle(goal)}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="flex items-center gap-1 font-display text-sm tabular-nums">
              {goal.achieved ? (
                <CheckIcon className="size-3.5 text-primary" />
              ) : null}
              {formatGoalProgress(goal)}
            </span>
            <TrainingGoalMobileActions goal={goal} />
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          {formatGoalPeriod(goal.period)}
        </p>
        <RouteProgress className="mt-3" value={progress} />
      </div>
    );
  }

  return (
    <article className="border-border/50 border-b py-6 first:border-t">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
          {formatGoalPeriod(goal.period)}
        </p>
        <span
          className={cn(
            "flex items-center gap-1.5 font-display text-sm tabular-nums",
            goal.achieved ? "text-primary" : "text-muted-foreground",
          )}
        >
          {goal.achieved ? <CheckIcon className="size-3.5" /> : null}
          {goal.achieved ? "Achieved" : `${Math.round(progress)}% traced`}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-2xl leading-none tracking-tight">
            {formatGoalTitle(goal)}
          </h3>
          <p className="mt-2 text-muted-foreground text-sm tabular-nums">
            {formatGoalProgress(goal)}
          </p>
        </div>
      </div>
      <RouteProgress className="mt-4" value={progress} />
      <TrainingGoalActions goal={goal} />
    </article>
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
      className="mt-5 flex flex-col gap-3 rounded-lg bg-muted/50 p-4 sm:flex-row"
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
