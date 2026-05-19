function formatDistance(distanceMeters: number | null) {
  if (distanceMeters === null) {
    return "-- km";
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatDurationClock(durationSeconds: number | null) {
  if (durationSeconds === null || !Number.isFinite(durationSeconds)) {
    return "--";
  }

  const roundedSeconds = Math.round(durationSeconds);
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const seconds = roundedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${padTime(minutes)}:${padTime(seconds)}`;
  }

  return `${minutes}:${padTime(seconds)}`;
}

function formatDurationCompact(durationSeconds: number) {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function formatSpeed(speedMetersPerSecond: number | null) {
  if (speedMetersPerSecond === null) {
    return "-- km/h";
  }

  return `${(speedMetersPerSecond * 3.6).toFixed(1)} km/h`;
}

function formatSignedNumber(value: number) {
  return value >= 0 ? `+${value}` : value.toString();
}

function formatShortDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatShortMonth(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, { month: "short" }).format(
    new Date(value),
  );
}

function padTime(value: number) {
  return value.toString().padStart(2, "0");
}

export {
  formatDistance,
  formatDurationClock,
  formatDurationCompact,
  formatShortDate,
  formatShortMonth,
  formatSignedNumber,
  formatSpeed,
};
