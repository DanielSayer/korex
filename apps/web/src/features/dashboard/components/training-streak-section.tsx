import type {
  CurrentTrainingWeekQualifyingActivities,
  TrainingStreak,
} from "@korex/api/modules/activities/activities.types";
import { ErrorMessage } from "@/components/error-message";
import { TrainingStreakSkeleton } from "./training-streak-skeleton";
import { TrainingStreakWidget } from "./training-streak-widget";

function TrainingStreakSection({
  currentWeek,
  isError,
  isLoading,
  streak,
}: {
  currentWeek?: CurrentTrainingWeekQualifyingActivities;
  isError: boolean;
  isLoading: boolean;
  streak?: TrainingStreak | null;
}) {
  if (isLoading) {
    return <TrainingStreakSkeleton />;
  }

  if (isError || !currentWeek) {
    return (
      <ErrorMessage
        message="Could not load your training streak."
        variant="banner"
      />
    );
  }

  return (
    <TrainingStreakWidget currentWeek={currentWeek} streak={streak ?? null} />
  );
}

export { TrainingStreakSection };
