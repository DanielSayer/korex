import type { WeeklyTrainingSummaryListItem } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary.types";
import { CalendarDaysIcon } from "lucide-react";
import { useState } from "react";
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
      <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <CalendarDaysIcon className="mb-3 size-8 text-muted-foreground" />
        <h2 className="font-semibold text-lg">No weekly summaries yet</h2>
        <p className="mt-1 max-w-md text-muted-foreground text-sm">
          Completed training weeks will appear here after the worker generates
          their summary.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-2 md:gap-3 lg:grid-cols-2">
        {summaries.map((summary) => (
          <WeeklyTrainingSummaryCard
            isLink={isMobileViewport}
            isSelected={selectedSummary?.id === summary.id}
            key={summary.id}
            onSelect={() => setSelectedSummary(summary)}
            summary={summary}
          />
        ))}
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
