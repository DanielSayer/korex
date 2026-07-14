import { trainingStreakJobDefinition } from "../activity-job-definitions";
import {
  getTrainingStreakProjectionInputs,
  upsertTrainingStreak,
} from "./training-streak.repository";
import { getPreviousTrainingWeekStartAt } from "./training-streaks";

export const trainingStreakJobModule = trainingStreakJobDefinition.implement(
  async ({ userId, weekStartAt }, context) => {
    const inputs = await getTrainingStreakProjectionInputs({
      database: context.database,
      userId,
      weekStartAt,
    });
    const lastQualifiedWeekStartAt =
      inputs.streak?.lastQualifiedWeekStartAt ?? null;

    if (
      lastQualifiedWeekStartAt &&
      lastQualifiedWeekStartAt.getTime() > weekStartAt.getTime()
    ) {
      return;
    }

    context.signal.throwIfAborted();
    if (!inputs.hasQualifyingActivity && inputs.streak?.currentStreak) {
      await upsertTrainingStreak(
        {
          currentStreak: 0,
          lastQualifiedWeekStartAt: null,
          maxStreak: inputs.streak.maxStreak,
          userId,
        },
        context.database,
      );
    } else if (
      inputs.hasQualifyingActivity &&
      lastQualifiedWeekStartAt?.getTime() !== weekStartAt.getTime()
    ) {
      const previousWeekStartAt = getPreviousTrainingWeekStartAt(weekStartAt);
      const previousCurrentStreak = inputs.streak?.currentStreak ?? 0;
      const currentStreak =
        lastQualifiedWeekStartAt?.getTime() === previousWeekStartAt.getTime()
          ? previousCurrentStreak + 1
          : 1;

      await upsertTrainingStreak(
        {
          currentStreak,
          lastQualifiedWeekStartAt: weekStartAt,
          maxStreak: Math.max(currentStreak, inputs.streak?.maxStreak ?? 0),
          userId,
        },
        context.database,
      );
    }
  },
);
