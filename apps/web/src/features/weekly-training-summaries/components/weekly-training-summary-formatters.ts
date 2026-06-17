import {
  formatDistance,
  formatDurationCompact,
  formatSpeed,
} from "@/utils/formatters";

function formatTrainingWeek(weekStartAt: Date, weekEndAt: Date) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  });
  const start = new Date(weekStartAt);
  const end = new Date(new Date(weekEndAt).getTime() - 1);

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function formatGeneratedAt(generatedAt: Date) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(generatedAt));
}

function formatDistanceDelta(distanceMeters: number) {
  const sign = distanceMeters >= 0 ? "+" : "-";

  return `${sign}${formatDistance(Math.abs(distanceMeters))}`;
}

function formatDurationDelta(durationSeconds: number) {
  const sign = durationSeconds >= 0 ? "+" : "-";

  return `${sign}${formatDurationCompact(Math.abs(durationSeconds))}`;
}

function formatSpeedDelta(speedMetersPerSecond: number | null) {
  if (speedMetersPerSecond === null) {
    return "-- km/h";
  }

  const sign = speedMetersPerSecond >= 0 ? "+" : "-";

  return `${sign}${formatSpeed(Math.abs(speedMetersPerSecond))}`;
}

function formatActivityDate(startAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(startAt));
}

function formatTrainingWeekParam(weekStartAt: Date) {
  const brisbaneUtcOffsetHours = 10;
  const millisecondsPerHour = 60 * 60 * 1000;
  const brisbaneTime = new Date(
    new Date(weekStartAt).getTime() +
      brisbaneUtcOffsetHours * millisecondsPerHour,
  );

  return brisbaneTime.toISOString().slice(0, 10);
}

export {
  formatActivityDate,
  formatDistanceDelta,
  formatDurationDelta,
  formatGeneratedAt,
  formatSpeedDelta,
  formatTrainingWeek,
  formatTrainingWeekParam,
};
