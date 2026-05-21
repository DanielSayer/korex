const brisbaneUtcOffsetHours = 10;
const millisecondsPerHour = 60 * 60 * 1000;

export function getBrisbaneCalendarDateStartAt(
  year: number,
  monthIndex: number,
  day: number,
) {
  return new Date(
    Date.UTC(year, monthIndex, day) -
      brisbaneUtcOffsetHours * millisecondsPerHour,
  );
}

export function toUtcDate(value: Date | string) {
  if (value instanceof Date) {
    return value;
  }

  return new Date(`${value.replace(" ", "T")}Z`);
}
