import {
  formatDistance,
  formatDurationClock as formatDuration,
} from "@/utils/formatters";

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

export { formatActivityDate, formatDistance, formatDuration };
