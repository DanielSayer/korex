import { Button } from "@korex/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@korex/ui/components/sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, TargetIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RouteAccent, SectionLabel } from "@/components/brand";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { TrainingGoalTargetField } from "./training-goal-form";
import { type GoalMetric, toTargetValue } from "./training-goal-target";

type GoalPeriod = "trainingWeek" | "calendarMonth";

type TrainingGoalCreateFormProps = {
  density?: "default" | "mobile";
};

function TrainingGoalCreateForm({
  density = "default",
}: TrainingGoalCreateFormProps) {
  const queryClient = useQueryClient();
  const progressQueryOptions =
    orpc.activities.trainingGoalProgress.queryOptions();
  const [metric, setMetric] = useState<GoalMetric>("distance");
  const [period, setPeriod] = useState<GoalPeriod>("trainingWeek");
  const [target, setTarget] = useState("40");
  const [open, setOpen] = useState(false);
  const targetValue = useMemo(
    () => toTargetValue({ metric, target }),
    [metric, target],
  );
  const createMutation = useMutation(
    orpc.activities.createTrainingGoal.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: async () => {
        toast.success("Training goal created");
        setOpen(false);
        await queryClient.invalidateQueries({
          queryKey: progressQueryOptions.queryKey,
        });
      },
    }),
  );
  const isMobile = density === "mobile";

  const form = (
    <GoalCreateFormFields
      createMutationIsPending={createMutation.isPending}
      density={density}
      metric={metric}
      onMetricChange={setMetric}
      onPeriodChange={setPeriod}
      onSubmit={() => {
        if (targetValue === null) {
          toast.error("Enter a target greater than zero.");
          return;
        }

        createMutation.mutate({
          metric,
          period,
          targetValue,
        });
      }}
      onTargetChange={setTarget}
      period={period}
      target={target}
      targetValue={targetValue}
    />
  );

  if (isMobile) {
    return (
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetTrigger
          render={
            <Button size="sm" type="button">
              <PlusIcon className="size-4" />
              New
            </Button>
          }
        />
        <SheetContent
          className="max-h-[85svh] overflow-y-auto rounded-t-xl p-0 pb-[env(safe-area-inset-bottom)]"
          side="bottom"
        >
          <SheetHeader className="border-b p-5">
            <SheetTitle className="font-display lowercase tracking-tight">
              New goal
            </SheetTitle>
            <SheetDescription>
              Set a recurring running target for a week or month.
            </SheetDescription>
          </SheetHeader>
          <div className="p-5">{form}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-muted/60 p-6">
      <RouteAccent className="absolute top-6 right-5 h-4 w-24 text-journal-route opacity-70" />
      <div className="relative">
        <SectionLabel>Next marker</SectionLabel>
        <h2 className="mt-3 max-w-52 font-display text-2xl leading-tight tracking-tight">
          Set a recurring goal.
        </h2>
        <p className="mt-2 max-w-xs text-muted-foreground text-sm leading-relaxed">
          Running progress updates from current Activities every week or month.
        </p>
      </div>
      <div className="relative mt-6 border-border/50 border-t pt-5">{form}</div>
    </section>
  );
}

function GoalCreateFormFields({
  createMutationIsPending,
  density,
  metric,
  onMetricChange,
  onPeriodChange,
  onSubmit,
  onTargetChange,
  period,
  target,
  targetValue,
}: {
  createMutationIsPending: boolean;
  density: "default" | "mobile";
  metric: GoalMetric;
  onMetricChange: (metric: GoalMetric) => void;
  onPeriodChange: (period: GoalPeriod) => void;
  onSubmit: () => void;
  onTargetChange: (target: string) => void;
  period: GoalPeriod;
  target: string;
  targetValue: number | null;
}) {
  return (
    <form
      className={cn("grid gap-4", density === "default" && "gap-5")}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div
        className={cn(
          "grid gap-3 sm:grid-cols-2",
          density === "default" && "sm:grid-cols-1",
        )}
      >
        <SegmentedControl
          label="Metric"
          onChange={onMetricChange}
          options={[
            { label: "Distance", value: "distance" },
            { label: "Runs", value: "activityCount" },
          ]}
          value={metric}
        />
        <SegmentedControl
          label="Period"
          onChange={onPeriodChange}
          options={[
            { label: "Week", value: "trainingWeek" },
            { label: "Month", value: "calendarMonth" },
          ]}
          value={period}
        />
      </div>
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row",
          density === "default" && "sm:flex-col",
        )}
      >
        <TrainingGoalTargetField
          id="training-goal-target"
          label="Target"
          metric={metric}
          onChange={onTargetChange}
          target={target}
        />
        <Button
          className={cn(
            "w-full self-end sm:w-auto",
            density === "default" && "sm:w-full",
          )}
          disabled={targetValue === null}
          loading={createMutationIsPending}
          loadingText="Creating"
          type="submit"
        >
          <TargetIcon className="size-4" />
          Create goal
        </Button>
      </div>
    </form>
  );
}

function SegmentedControl<TValue extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: TValue) => void;
  options: Array<{ label: string; value: TValue }>;
  value: TValue;
}) {
  return (
    <div>
      <p className="mb-1.5 font-medium text-muted-foreground text-xs">
        {label}
      </p>
      <div className="grid grid-cols-2 rounded-md border bg-muted p-1">
        {options.map((option) => (
          <Button
            aria-pressed={option.value === value}
            className="h-8"
            key={option.value}
            onClick={() => onChange(option.value)}
            size="sm"
            type="button"
            variant={option.value === value ? "default" : "ghost"}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export { TrainingGoalCreateForm };
