import type {
  ActivityListItem,
  ActivitySummary,
} from "@korex/api/modules/activities/activities.types";
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

export function getActivityWeekKey(date: Date | string) {
  return getActivityDayKey(
    startOfWeek(new Date(date), {
      weekStartsOn,
    }),
  );
}

export function getMonthSearchValue(date: Date) {
  return format(startOfMonth(date), "yyyy-MM");
}

export function getMonthFromSearch(month: string | undefined) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return startOfMonth(new Date());
  }

  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText);
  const date = new Date(year, monthIndex - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return startOfMonth(new Date());
  }

  return date;
}

export const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type CalendarAgendaItem =
  | {
      date: Date;
      id: string;
      summary: ActivitySummary;
      type: "summary";
    }
  | {
      activities: ActivityListItem[];
      date: Date;
      id: string;
      type: "activityDay";
    };

export function getCalendarAgendaItems({
  activities,
  summaries,
  visibleMonth,
}: {
  activities: ActivityListItem[];
  summaries: ActivitySummary[];
  visibleMonth: Date;
}) {
  const activitiesByDay = new Map<string, ActivityListItem[]>();
  const datesByDay = new Map<string, Date>();
  const activeWeekKeys = new Set<string>();

  for (const activity of activities) {
    const activityDate = new Date(activity.startAt);

    if (!isSameMonth(activityDate, visibleMonth)) {
      continue;
    }

    const dayKey = getActivityDayKey(activityDate);
    const dayActivities = activitiesByDay.get(dayKey) ?? [];
    const dayDate = new Date(activityDate);
    dayDate.setHours(0, 0, 0, 0);
    dayActivities.push(activity);
    activitiesByDay.set(dayKey, dayActivities);
    datesByDay.set(dayKey, dayDate);
    activeWeekKeys.add(getActivityWeekKey(activityDate));
  }

  const items: CalendarAgendaItem[] = [];

  for (const summary of summaries) {
    const weekKey = getActivityWeekKey(summary.weekStartDate);

    if (activeWeekKeys.has(weekKey)) {
      const summaryDate = new Date(summary.weekStartDate);
      summaryDate.setHours(0, 0, 0, 0);

      items.push({
        date: summaryDate,
        id: `summary-${weekKey}`,
        summary,
        type: "summary",
      });
    }
  }

  for (const [dayKey, dayActivities] of activitiesByDay) {
    items.push({
      activities: [...dayActivities].sort(
        (first, second) =>
          new Date(second.startAt).getTime() -
          new Date(first.startAt).getTime(),
      ),
      date: datesByDay.get(dayKey) ?? new Date(dayKey),
      id: `activities-${dayKey}`,
      type: "activityDay",
    });
  }

  return items.sort((first, second) => {
    const firstWeekStart = startOfWeek(first.date, { weekStartsOn }).getTime();
    const secondWeekStart = startOfWeek(second.date, {
      weekStartsOn,
    }).getTime();
    const weekDifference = secondWeekStart - firstWeekStart;

    if (weekDifference !== 0) {
      return weekDifference;
    }

    if (first.type !== second.type) {
      return first.type === "summary" ? -1 : 1;
    }

    return second.date.getTime() - first.date.getTime();
  });
}
