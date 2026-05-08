function formatDistance(distanceMeters: number | null) {
  if (distanceMeters === null) {
    return "-- km";
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatDuration(durationSeconds: number | null) {
  if (durationSeconds === null) {
    return "--";
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours > 0) {
    return `${hours}:${padTime(minutes)}:${padTime(seconds)}`;
  }

  return `${minutes}:${padTime(seconds)}`;
}

function formatActivityDate(startAt: Date) {
  const activityDate = new Date(startAt);
  const today = new Date();
  const startOfToday = startOfDay(today).getTime();
  const startOfActivityDay = startOfDay(activityDate).getTime();
  const daysAgo = Math.round(
    (startOfToday - startOfActivityDay) / (24 * 60 * 60 * 1000),
  );

  if (daysAgo === 0) {
    return "Today";
  }

  if (daysAgo === 1) {
    return "Yesterday";
  }

  return `${daysAgo} days ago`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function padTime(value: number) {
  return value.toString().padStart(2, "0");
}

export { formatActivityDate, formatDistance, formatDuration };
