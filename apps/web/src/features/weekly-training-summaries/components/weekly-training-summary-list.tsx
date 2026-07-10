import type { WeeklyTrainingSummaryListItem } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary.types";
import { CalendarDaysIcon } from "lucide-react";
import { useState } from "react";
import { SectionLabel } from "@/components/brand";
import { useIsMobileViewport } from "@/components/responsive";
import { WeeklyTrainingSummaryCard } from "./weekly-training-summary-card";
import { WeeklyTrainingSummaryDetailPanel } from "./weekly-training-summary-detail-panel";

type WeeklyTrainingSummaryListProps = {
  summaries: WeeklyTrainingSummaryListItem[];
};

function WeeklyTrainingSummaryList({
  summaries,
}: WeeklyTrainingSummaryListProps) {
  const isMobileViewport = useIsMobileViewport();
  const [selectedSummary, setSelectedSummary] =
    useState<WeeklyTrainingSummaryListItem | null>(null);

  if (summaries.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-start justify-center py-8 md:border-border/50 md:border-y md:px-4">
        <CalendarDaysIcon className="mb-3 size-8 text-muted-foreground" />
        <h2 className="font-display text-lg tracking-tight">
          No weekly summaries yet
        </h2>
        <p className="mt-1 max-w-md text-muted-foreground text-sm leading-relaxed">
          Completed training weeks will appear here once their summaries are
          generated.
        </p>
      </div>
    );
  }

  if (isMobileViewport) {
    return (
      <div className="grid gap-3">
        {summaries.map((summary) => (
          <WeeklyTrainingSummaryCard
            isLink
            isSelected={false}
            key={summary.id}
            onSelect={() => undefined}
            summary={summary}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex items-end justify-between gap-4 pb-3">
          <div>
            <SectionLabel>Completed weeks</SectionLabel>
            <p className="mt-1 text-muted-foreground text-sm">
              Stored snapshots from the trail behind you.
            </p>
          </div>
          <span className="font-display text-muted-foreground text-sm tabular-nums">
            {summaries.length} {summaries.length === 1 ? "week" : "weeks"}
          </span>
        </div>
        <div className="border-border/50 border-t">
          {summaries.map((summary) => (
            <WeeklyTrainingSummaryCard
              isLink={false}
              isSelected={selectedSummary?.id === summary.id}
              key={summary.id}
              onSelect={() => setSelectedSummary(summary)}
              summary={summary}
            />
          ))}
        </div>
      </div>
      <WeeklyTrainingSummaryDetailPanel
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSummary(null);
          }
        }}
        summary={selectedSummary}
      />
    </>
  );
}

export { WeeklyTrainingSummaryList };
