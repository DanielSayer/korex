export function createControllableClock(initialNow: Date) {
  let currentTimeMs = initialNow.getTime();

  return {
    advanceBy: (milliseconds: number) => {
      currentTimeMs += milliseconds;
    },
    now: () => new Date(currentTimeMs),
  };
}
