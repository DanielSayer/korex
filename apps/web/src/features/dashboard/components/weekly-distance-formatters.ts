const trainingWeekTimeZone = "Australia/Brisbane";

function formatWeekRange(weekStartAt: Date | string) {
  const startAt = new Date(weekStartAt);
  const endAt = new Date(startAt);
  endAt.setDate(startAt.getDate() + 6);

  return `${formatShortDate(startAt)} - ${formatShortDate(endAt)}`;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    timeZone: trainingWeekTimeZone,
  }).format(date);
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    timeZone: trainingWeekTimeZone,
    year: "numeric",
  }).format(date);
}

export { formatLongDate, formatShortDate, formatWeekRange };
