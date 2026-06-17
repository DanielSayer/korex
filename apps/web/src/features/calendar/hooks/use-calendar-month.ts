import { useQuery } from "@tanstack/react-query";
import { addMonths, subMonths } from "date-fns";
import { orpc } from "@/utils/orpc";
import { getMonthGrid } from "../utils/calendar-month";

type UseCalendarMonthOptions = {
  onMonthChange: (month: Date) => void;
  visibleMonth: Date;
};

function useCalendarMonth({
  onMonthChange,
  visibleMonth,
}: UseCalendarMonthOptions) {
  const monthGrid = getMonthGrid(visibleMonth);
  const activitiesQuery = useQuery(
    orpc.activities.list.queryOptions({
      input: {
        endDate: monthGrid.gridEnd,
        startDate: monthGrid.gridStart,
      },
    }),
  );

  return {
    activities: activitiesQuery.data?.activities ?? [],
    isError: activitiesQuery.isError,
    isFetching: activitiesQuery.isFetching,
    isPending: activitiesQuery.isPending,
    monthGrid,
    onNextMonth: () => onMonthChange(addMonths(visibleMonth, 1)),
    onPreviousMonth: () => onMonthChange(subMonths(visibleMonth, 1)),
    onToday: () => onMonthChange(new Date()),
    summaries: activitiesQuery.data?.summaries ?? [],
    visibleMonth,
  };
}

export { useCalendarMonth };
