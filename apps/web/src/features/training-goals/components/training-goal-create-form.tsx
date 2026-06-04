import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TargetIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

type GoalMetric = "distance" | "activityCount";
type GoalPeriod = "trainingWeek" | "calendarMonth";

function TrainingGoalCreateForm() {
  const queryClient = useQueryClient();
  const progressQueryOptions =
    orpc.activities.trainingGoalProgress.queryOptions();
  const [metric, setMetric] = useState<GoalMetric>("distance");
  const [period, setPeriod] = useState<GoalPeriod>("trainingWeek");
  const [target, setTarget] = useState("40");
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
        await queryClient.invalidateQueries({
          queryKey: progressQueryOptions.queryKey,
        });
      },
    }),
  );

  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-center gap-3">
        <TargetIcon className="size-5 text-muted-foreground" />
        <h2 className="font-semibold text-lg">Create goal</h2>
      </div>
      <form
        className="mt-5 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();

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
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SegmentedControl
            label="Metric"
            onChange={setMetric}
            options={[
              { label: "Distance", value: "distance" },
              { label: "Runs", value: "activityCount" },
            ]}
            value={metric}
          />
          <SegmentedControl
            label="Period"
            onChange={setPeriod}
            options={[
              { label: "Week", value: "trainingWeek" },
              { label: "Month", value: "calendarMonth" },
            ]}
            value={period}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <label
              className="mb-1.5 block font-medium text-muted-foreground text-xs"
              htmlFor="training-goal-target"
            >
              Target {metric === "distance" ? "km" : "runs"}
            </label>
            <Input
              id="training-goal-target"
              inputMode="decimal"
              min="0"
              onChange={(event) => setTarget(event.target.value)}
              step={metric === "distance" ? "0.1" : "1"}
              type="number"
              value={target}
            />
          </div>
          <Button
            className="self-end sm:w-auto"
            disabled={targetValue === null}
            loading={createMutation.isPending}
            loadingText="Creating"
            type="submit"
          >
            <TargetIcon className="size-4" />
            Create goal
          </Button>
        </div>
      </form>
    </section>
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

function toTargetValue({
  metric,
  target,
}: {
  metric: GoalMetric;
  target: string;
}) {
  const value = Number(target);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return metric === "distance" ? Math.round(value * 1000) : Math.round(value);
}

export { TrainingGoalCreateForm };
