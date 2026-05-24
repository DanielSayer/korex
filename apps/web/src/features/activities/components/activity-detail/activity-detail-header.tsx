import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CalendarIcon } from "lucide-react";
import { formatActivityDateTime } from "@/utils/formatters";

type ActivityDetailHeaderProps = {
  activity: ActivityDetailSummary["activity"];
};

function ActivityDetailHeader({ activity }: ActivityDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <Button
          className="mb-3 px-0"
          variant="ghost"
          size="sm"
          render={<Link to="/dashboard" />}
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
        <h1 className="font-bold text-4xl">{activity.name}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
          <CalendarIcon className="size-4" />
          {formatActivityDateTime(activity.startAt)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        {activity.deviceName ? (
          <span className="text-muted-foreground text-sm">
            {activity.deviceName}
          </span>
        ) : null}
        <span className="inline-flex h-6 items-center rounded-md border bg-secondary px-2 font-medium text-secondary-foreground text-xs uppercase">
          {activity.sportType}
        </span>
      </div>
    </div>
  );
}

export { ActivityDetailHeader };
