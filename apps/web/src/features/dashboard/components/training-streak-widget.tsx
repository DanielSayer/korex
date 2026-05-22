import type {
  CurrentTrainingWeekQualifyingActivities,
  TrainingStreak,
} from "@korex/api/modules/activities/activities.types";
import { addDays, format, isSameDay } from "date-fns";
import { FlameIcon, FootprintsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type TrainingStreakWidgetProps = {
  currentWeek: CurrentTrainingWeekQualifyingActivities;
  streak: TrainingStreak | null;
};

function TrainingStreakWidget({
  currentWeek,
  streak,
}: TrainingStreakWidgetProps) {
  const weekStartAt = new Date(currentWeek.weekStartAt);
  const currentStreak = streak?.currentStreak ?? 0;
  const days = Array.from({ length: 7 }, (_, dayIndex) => {
    const date = addDays(weekStartAt, dayIndex);
    const hasActivity = currentWeek.activities.some((activity) =>
      isSameDay(new Date(activity.startAt), date),
    );

    return {
      date,
      dayLabel: format(date, "EEEEE"),
      hasActivity,
      valueLabel: format(date, "d"),
    };
  });

  return (
    <section className="border-y py-5">
      <h2 className="font-semibold text-lg">Your streak</h2>
      <div className="mt-4 flex items-end gap-4 sm:gap-6">
        <div className="flex w-14 shrink-0 flex-col items-center">
          <div className="relative flex h-16 w-12 items-center justify-center">
            <FlameIcon
              aria-hidden="true"
              className="absolute inset-0 size-full fill-orange-600 text-orange-600"
              strokeWidth={1.75}
            />
            <span className="relative pt-3 font-bold text-sm text-white tabular-nums">
              {currentStreak}
            </span>
          </div>
          <span className="font-semibold text-orange-600 text-xs">Weeks</span>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-7 gap-1 sm:gap-3">
          {days.map((day) => (
            <div
              className="flex min-w-0 flex-col items-center gap-2"
              key={day.date.toISOString()}
            >
              <span className="font-medium text-muted-foreground text-sm">
                {day.dayLabel}
              </span>
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border text-sm tabular-nums",
                  day.hasActivity
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-border bg-background text-foreground",
                )}
                title={
                  day.hasActivity
                    ? "Qualifying activity logged"
                    : "No qualifying activity logged"
                }
              >
                {day.hasActivity ? (
                  <FootprintsIcon className="size-5" strokeWidth={2.25} />
                ) : (
                  day.valueLabel
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { TrainingStreakWidget };
