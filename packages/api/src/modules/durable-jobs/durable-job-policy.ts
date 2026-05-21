export const durableJobRetryDelaysSeconds = [1, 2, 4] as const;

export const durableJobMaxRetryAttempts = durableJobRetryDelaysSeconds.length;

export function getDurableJobFailureState({
  attemptCount,
  error,
  now,
}: {
  attemptCount: number;
  error: string;
  now: Date;
}) {
  const nextAttemptCount = attemptCount + 1;
  const retryDelaySeconds = durableJobRetryDelaysSeconds[nextAttemptCount - 1];

  return {
    attemptCount: nextAttemptCount,
    lastError: error,
    lockedAt: null,
    lockedBy: null,
    runAfter:
      retryDelaySeconds === undefined
        ? now
        : new Date(now.getTime() + retryDelaySeconds * 1000),
    status: "failed" as const,
    updatedAt: now,
  };
}
