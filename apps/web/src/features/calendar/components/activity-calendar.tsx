import { useIsMobileViewport } from "@/components/responsive";
import { useCalendarMonth } from "../hooks/use-calendar-month";
import { ActivityCalendarDesktop } from "./activity-calendar-desktop";
import { ActivityCalendarMobile } from "./activity-calendar-mobile";

type ActivityCalendarProps = {
  onMonthChange: (month: Date) => void;
  visibleMonth: Date;
};

function ActivityCalendar({
  onMonthChange,
  visibleMonth,
}: ActivityCalendarProps) {
  const isMobileViewport = useIsMobileViewport();
  const calendarMonth = useCalendarMonth({ onMonthChange, visibleMonth });

  return isMobileViewport ? (
    <ActivityCalendarMobile {...calendarMonth} />
  ) : (
    <ActivityCalendarDesktop {...calendarMonth} />
  );
}

export { ActivityCalendar };
