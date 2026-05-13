import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ActivityCalendar } from "@/features/calendar/components/activity-calendar";
import {
  getMonthFromSearch,
  getMonthSearchValue,
} from "@/features/calendar/utils/calendar-month";

export const Route = createFileRoute("/_authenticated/calendar")({
  validateSearch: z.object({
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional()
      .catch(undefined),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const visibleMonth = getMonthFromSearch(search.month);

  return (
    <ActivityCalendar
      visibleMonth={visibleMonth}
      onMonthChange={(month) =>
        navigate({
          search: {
            month: getMonthSearchValue(month),
          },
        })
      }
    />
  );
}
