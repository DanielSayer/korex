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
    <section className="flex h-full min-h-72 flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>Training streak</SectionLabel>
          <h2 className="mt-2 font-display font-medium text-2xl">
            Keep the trail alive
          </h2>
        </div>
        <div className="text-right">
          <p className="font-display font-medium text-6xl tabular-nums leading-none tracking-tighter">
            {currentStreak}
          </p>
          <p className="mt-1 text-[9px] text-muted-foreground uppercase tracking-[0.14em]">
            weeks
          </p>
        </div>
      </div>

      <div className="relative mt-10">
        <div
          aria-hidden="true"
          className="absolute top-[18px] right-[7%] left-[7%] h-px bg-border"
        />
        <ol className="relative grid grid-cols-7 gap-2">
          {days.map((day) => (
            <li
              className="flex min-w-0 flex-col items-center"
              key={day.date.toISOString()}
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full border",
                  day.hasActivity
                    ? "border-journal-hero bg-journal-hero text-journal-route"
                    : "border-border bg-background text-muted-foreground",
                )}
                title={
                  day.hasActivity
                    ? "Qualifying Activity logged"
                    : "No qualifying Activity logged"
                }
              >
                {day.hasActivity ? (
                  <FlameIcon
                    aria-hidden="true"
                    className="size-4 fill-current"
                  />
                ) : (
                  <span className="text-[10px] tabular-nums">
                    {day.valueLabel}
                  </span>
                )}
              </span>
              <span className="mt-3 text-[9px] text-muted-foreground uppercase">
                {day.dayLabel}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 border-border border-t pt-5">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.12em]">
            Longest streak
          </p>
          <p className="mt-1 font-display font-medium text-xl tabular-nums">
            {streak?.maxStreak ?? 0} weeks
          </p>
        </div>
        <p className="max-w-44 text-right text-[10px] text-muted-foreground leading-relaxed">
          One qualifying Activity keeps this week moving.
        </p>
      </div>
    </section>
  );
}

export { TrainingStreakWidget };
