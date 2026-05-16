const brisbaneUtcOffsetHours = 10;
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const millisecondsPerHour = 60 * 60 * 1000;

export function getCompletedTrainingWeek(now = new Date()) {
  const currentWeekStartAt = getTrainingWeekStartAt(now);

  return {
    weekEndAt: currentWeekStartAt,
    weekStartAt: new Date(
      currentWeekStartAt.getTime() - 7 * millisecondsPerDay,
    ),
  };
}

export function getTrainingWeekStartAt(date: Date) {
  const brisbaneTime = new Date(
    date.getTime() + brisbaneUtcOffsetHours * millisecondsPerHour,
  );
  const day = brisbaneTime.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  brisbaneTime.setUTCHours(0, 0, 0, 0);
  brisbaneTime.setUTCDate(brisbaneTime.getUTCDate() - daysSinceMonday);

  return new Date(
    brisbaneTime.getTime() - brisbaneUtcOffsetHours * millisecondsPerHour,
  );
}
