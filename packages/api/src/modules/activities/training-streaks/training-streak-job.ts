import type { JobHandler } from "../../job-runtime/job-runtime";
import {
  getTrainingStreakProjectionInputs,
  upsertTrainingStreak,
} from "./training-streak.repository";
import { getPreviousTrainingWeekStartAt } from "./training-streaks";

export const trainingStreakJobName = "training-streak.update";

type TrainingStreakJobDependencies = {
  getInputs: typeof getTrainingStreakProjectionInputs;
  upsertStreak: typeof upsertTrainingStreak;
};

export function createTrainingStreakJobModule(
  dependencies: TrainingStreakJobDependencies,
) {
  return {
    handler: async (
      payload: Record<string, unknown>,
      context: Parameters<JobHandler>[1],
    ) => {
      context.signal.throwIfAborted();
      const userId = requiredUserId(payload);
      const weekStartAt = requiredWeekStartAt(payload);
      const inputs = await dependencies.getInputs({
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
        await dependencies.upsertStreak(
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

        await dependencies.upsertStreak(
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
    name: trainingStreakJobName,
  };
}

export const trainingStreakJobModule = createTrainingStreakJobModule({
  getInputs: getTrainingStreakProjectionInputs,
  upsertStreak: upsertTrainingStreak,
});

function requiredUserId(payload: Record<string, unknown>) {
  if (typeof payload.userId !== "string" || payload.userId.length === 0) {
    throw new Error("Training Streak job requires a userId");
  }

  return payload.userId;
}

function requiredWeekStartAt(payload: Record<string, unknown>) {
  const value = payload.weekStartAt;
  const weekStartAt = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(weekStartAt.getTime())) {
    throw new Error("Training Streak job requires a valid weekStartAt");
  }

  return weekStartAt;
}
