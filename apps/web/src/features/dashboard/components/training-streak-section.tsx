import { useQueries } from "@tanstack/react-query";
import { ErrorMessage } from "@/components/error-message";
import { orpc } from "@/utils/orpc";
import { TrainingStreakSkeleton } from "./training-streak-skeleton";
import { TrainingStreakWidget } from "./training-streak-widget";

function TrainingStreakSection() {
  const [streakQuery, currentWeekQuery] = useQueries({
    queries: [
      orpc.activities.trainingStreak.queryOptions(),
      orpc.activities.trainingStreakCurrentWeek.queryOptions(),
    ],
  });
  if (streakQuery.isPending || currentWeekQuery.isPending) {
    return <TrainingStreakSkeleton />;
  }

  if (streakQuery.isError || currentWeekQuery.isError) {
    return (
      <ErrorMessage
        message="Could not load your training streak."
        variant="banner"
      />
    );
  }

  return (
    <TrainingStreakWidget
      currentWeek={currentWeekQuery.data}
      streak={streakQuery.data}
    />
  );
}

export { TrainingStreakSection };
