import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

const weekStartsOn = 1;

export type CalendarDay = {
  date: Date;
  dayLabel: string;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export function getMonthGrid(referenceDate: Date) {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn });
  const today = new Date();
  const days: CalendarDay[] = [];

  for (let date = gridStart; date <= gridEnd; date = addDays(date, 1)) {
    days.push({
      date,
      dayLabel: format(date, "d"),
      isCurrentMonth: isSameMonth(date, monthStart),
      isToday: isSameDay(date, today),
    });
  }

  return {
    days,
    gridEnd,
    gridStart,
    monthLabel: format(monthStart, "MMMM yyyy"),
  };
}

export function getActivityDayKey(date: Date | string) {
  return format(new Date(date), "yyyy-MM-dd");
}

export function getMonthSearchValue(date: Date) {
  return format(startOfMonth(date), "yyyy-MM");
}

export function getMonthFromSearch(month: string | undefined) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return startOfMonth(new Date());
  }

  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return startOfMonth(new Date());
  }

  return date;
}

export const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
