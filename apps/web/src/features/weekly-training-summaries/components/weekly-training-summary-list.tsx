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
      <div className="flex min-h-56 flex-col items-start justify-center py-8">
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

  return (
    <>
      <div className="grid gap-3 md:gap-3 lg:grid-cols-2">
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
