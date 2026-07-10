import type { ActivityDetailSummary } from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CalendarIcon } from "lucide-react";
import { SectionLabel, WaypointDot } from "@/components/brand";
import { formatActivityDateTime } from "@/utils/formatters";

type ActivityDetailHeaderProps = {
  activity: ActivityDetailSummary["activity"];
};

function ActivityDetailHeader({ activity }: ActivityDetailHeaderProps) {
  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <Button
          className="mb-5 px-0 text-muted-foreground hover:text-foreground"
          variant="ghost"
          size="sm"
          render={<Link to="/dashboard" />}
        >
          <ArrowLeftIcon className="size-4" />
          Dashboard
        </Button>
        <SectionLabel>Activity detail</SectionLabel>
        <h1 className="mt-1 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight">
          {activity.name}
        </h1>
        <p className="mt-3 flex items-center gap-1.5 text-muted-foreground text-sm">
          <CalendarIcon className="size-4" />
          {formatActivityDateTime(activity.startAt)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 lg:justify-end lg:pb-1">
        {activity.deviceName ? (
          <span className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
            {activity.deviceName}
          </span>
        ) : null}
        <span className="inline-flex h-7 items-center gap-2 rounded-full bg-secondary px-3 font-medium text-secondary-foreground text-xs uppercase tracking-wider">
          <WaypointDot className="size-1.5 bg-journal-route" />
          {activity.sportType}
        </span>
      </div>
    </header>
  );
}

export { ActivityDetailHeader };
