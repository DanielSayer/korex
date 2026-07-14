import type { TrainingGoalProgress } from "@korex/api/modules/activities/training-goals/training-goal.types";
import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArchiveIcon, SaveIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";
import {
  type GoalMetric,
  toDisplayTarget,
  toTargetValue,
} from "./training-goal-target";

function TrainingGoalTargetField({
  id,
  label,
  metric,
  onChange,
  target,
}: {
  id: string;
  label: string;
  metric: GoalMetric;
  onChange: (target: string) => void;
  target: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <label
        className="mb-1.5 block font-medium text-muted-foreground text-xs"
        htmlFor={id}
      >
        {label} {metric === "distance" ? "km" : "runs"}
      </label>
      <Input
        id={id}
        inputMode="decimal"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        step={metric === "distance" ? "0.1" : "1"}
        type="number"
        value={target}
      />
    </div>
  );
}

function TrainingGoalEditForm({
  actionsClassName,
  buttonSize,
  fieldId,
  formClassName,
  goal,
  onSuccess,
}: {
  actionsClassName: string;
  buttonSize?: "sm";
  fieldId: string;
  formClassName: string;
  goal: TrainingGoalProgress;
  onSuccess?: () => void;
}) {
  const editor = useTrainingGoalEditor({ goal, onSuccess });

  return (
    <form
      className={formClassName}
      onSubmit={(event) => {
        event.preventDefault();
        editor.update();
      }}
    >
      <TrainingGoalTargetField
        id={fieldId}
        label="Next target"
        metric={goal.metric}
        onChange={editor.setTarget}
        target={editor.target}
      />
      <div className={actionsClassName}>
        <Button
          disabled={editor.targetValue === null}
          loading={editor.isUpdating}
          loadingText="Saving"
          size={buttonSize}
          type="submit"
        >
          <SaveIcon className="size-4" />
          Save
        </Button>
        <Button
          loading={editor.isArchiving}
          loadingText="Archiving"
          onClick={editor.archive}
          size={buttonSize}
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

function useTrainingGoalEditor({
  goal,
  onSuccess,
}: {
  goal: TrainingGoalProgress;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const progressQueryOptions =
    orpc.activities.trainingGoalProgress.queryOptions();
  const [target, setTarget] = useState(() => toDisplayTarget(goal));
  const targetValue = toTargetValue({ metric: goal.metric, target });
  const handleSuccess = async (message: string) => {
    toast.success(message);
    onSuccess?.();
    await queryClient.invalidateQueries({
      queryKey: progressQueryOptions.queryKey,
    });
  };
  const mutationCallbacks = (successMessage: string) => ({
    onError: (error: { message: string }) => toast.error(error.message),
    onSuccess: () => handleSuccess(successMessage),
  });
  const updateMutation = useMutation(
    orpc.activities.updateTrainingGoal.mutationOptions({
      ...mutationCallbacks("Training goal updated"),
    }),
  );
  const archiveMutation = useMutation(
    orpc.activities.archiveTrainingGoal.mutationOptions({
      ...mutationCallbacks("Training goal archived"),
    }),
  );

  return {
    archive: () => archiveMutation.mutate({ id: goal.id }),
    isArchiving: archiveMutation.isPending,
    isUpdating: updateMutation.isPending,
    setTarget,
    target,
    targetValue,
    update: () => {
      if (targetValue === null) {
        toast.error("Enter a target greater than zero.");
        return;
      }

      updateMutation.mutate({ id: goal.id, targetValue });
    },
  };
}

export { TrainingGoalEditForm, TrainingGoalTargetField };
