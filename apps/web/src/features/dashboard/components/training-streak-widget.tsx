import type {
  CurrentTrainingWeekQualifyingActivities,
  TrainingStreak,
} from "@korex/api/modules/activities/activities.types";
import { addDays, format, isSameDay } from "date-fns";
import { FlameIcon } from "lucide-react";
import { SectionLabel } from "@/components/brand";
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
    <section>
      <div className="grid gap-5">
        <div className="flex items-end justify-between gap-4 border-border/70 border-b pb-4">
          <div>
            <SectionLabel>Your streak</SectionLabel>
            <p className="mt-1 font-semibold text-muted-foreground text-xs uppercase">
              Weeks
            </p>
          </div>
          <p className="font-display text-6xl text-primary tabular-nums leading-none">
            {currentStreak}
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-7 gap-1.5 sm:gap-3">
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
                  "flex size-9 items-center justify-center rounded-full border text-sm tabular-nums sm:size-10",
                  day.hasActivity
                    ? "border-primary/20 bg-foreground text-background dark:bg-foreground dark:text-background"
                    : "border-border bg-background/40 text-foreground",
                )}
                title={
                  day.hasActivity
                    ? "Qualifying activity logged"
                    : "No qualifying activity logged"
                }
              >
                {day.hasActivity ? (
                  <FlameIcon
                    className="size-5 fill-destructive text-destructive"
                    strokeWidth={2.25}
                  />
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
