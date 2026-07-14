import type { TrainingGoalProgress } from "@korex/api/modules/activities/training-goals/training-goal.types";
import { Button } from "@korex/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@korex/ui/components/sheet";
import { cn } from "@korex/ui/lib/utils";
import { CheckIcon, MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { RouteProgress } from "@/components/brand";
import { TrainingGoalEditForm } from "./training-goal-form";
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
  return (
    <TrainingGoalEditForm
      actionsClassName="flex gap-2 self-end"
      buttonSize="sm"
      fieldId={`training-goal-${goal.id}-target`}
      formClassName="mt-5 flex flex-col gap-3 rounded-lg bg-muted/50 p-4 sm:flex-row"
      goal={goal}
    />
  );
}

function TrainingGoalMobileActions({ goal }: { goal: TrainingGoalProgress }) {
  const [open, setOpen] = useState(false);

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
        <TrainingGoalEditForm
          actionsClassName="grid grid-cols-2 gap-2"
          fieldId={`training-goal-${goal.id}-target-mobile`}
          formClassName="grid gap-4 p-5"
          goal={goal}
          onSuccess={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

export { TrainingGoalList };
